import { Competition, ICompetition } from './competition.entity';
import { Team, ITeam } from './team.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { TeamId } from '../value-objects/team-id.vo';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { TeamCreatedEvent } from '../events/team-created.event';

describe('Monitoring Domain Entities Integration', () => {
  describe('Competition and Team entities interaction', () => {
    let competition: Competition;
    let team: Team;
    let competitionProps: ICompetition;
    let teamProps: ITeam;

    beforeEach(() => {
      competitionProps = {
        id: CompetitionId.create(110),
        name: 'Premier League 2024',
        url: 'https://example.com/premier-league',
        version: '2024.1',
      };

      teamProps = {
        id: TeamId.create('123-MAN'),
        name: 'Manchester United',
        url: 'https://example.com/teams/manchester-united',
      };

      competition = Competition.create(competitionProps);
      team = Team.create(teamProps);
    });

    it('should create both entities successfully', () => {
      expect(competition).toBeDefined();
      expect(team).toBeDefined();
      expect(competition).toBeInstanceOf(Competition);
      expect(team).toBeInstanceOf(Team);
    });

    it('should generate different event types for different entities', () => {
      const competitionEvents = competition.getUncommittedEvents();
      const teamEvents = team.getUncommittedEvents();

      expect(competitionEvents[0]).toBeInstanceOf(CompetitionCreatedEvent);
      expect(teamEvents[0]).toBeInstanceOf(TeamCreatedEvent);
      expect(competitionEvents[0]).not.toBeInstanceOf(TeamCreatedEvent);
      expect(teamEvents[0]).not.toBeInstanceOf(CompetitionCreatedEvent);
    });

    it('should have different ID types and behaviors', () => {
      const competitionId = competition.getId();
      const teamId = team.getId();

      expect(competitionId).toBeInstanceOf(CompetitionId);
      expect(teamId).toBeInstanceOf(TeamId);

      // Competition ID is numeric
      expect(typeof competitionId.value).toBe('number');
      // Team ID is composite string
      expect(typeof teamId.value).toBe('string');
      expect(teamId.value).toContain('-');
    });

    it('should have consistent BaseEntity behavior', () => {
      // Both should have timestamps
      expect(competition.createdAt).toBeDefined();
      expect(team.createdAt).toBeDefined();
      expect(competition.updatedAt).toBeDefined();
      expect(team.updatedAt).toBeDefined();

      // Both should implement equals correctly
      const sameCompetition = Competition.create(competitionProps);
      const sameTeam = Team.create(teamProps);

      expect(competition.equals(sameCompetition)).toBe(true);
      expect(team.equals(sameTeam)).toBe(true);
      expect(competition.equals(team as any)).toBe(false);
    });

    it('should serialize to JSON consistently', () => {
      const competitionJson = JSON.parse(competition.toJSON());
      const teamJson = JSON.parse(team.toJSON());

      expect(competitionJson).toHaveProperty('name');
      expect(competitionJson).toHaveProperty('url');
      expect(competitionJson).toHaveProperty('version');
      expect(competitionJson).toHaveProperty('id');

      expect(teamJson).toHaveProperty('name');
      expect(teamJson).toHaveProperty('url');
      expect(teamJson).toHaveProperty('id');
      expect(teamJson).not.toHaveProperty('version');
    });

    it('should handle creation with real-world data patterns', () => {
      const realCompetition = Competition.create({
        id: CompetitionId.create(2024),
        name: 'UEFA Champions League 2024/25',
        url: 'https://uefa.com/uefachampionsleague/',
        version: '2024.25.1',
      });

      const realTeam = Team.create({
        id: TeamId.create('789-FCB'),
        name: 'FC Barcelona',
        url: 'https://fcbarcelona.com',
      });

      expect(realCompetition.getName()).toBe('UEFA Champions League 2024/25');
      expect(realTeam.getName()).toBe('FC Barcelona');
      expect(realCompetition.getId().value).toBe(2024);
      expect(realTeam.getId().value).toBe('789-FCB');
    });
  });

  describe('Entity validation consistency', () => {
    it('should apply same validation rules for empty names', () => {
      const emptyCompetitionProps = {
        id: CompetitionId.create(1),
        name: '',
        url: 'https://example.com',
        version: '1.0',
      };

      const emptyTeamProps = {
        id: TeamId.create('123-ABC'),
        name: '',
        url: 'https://example.com',
      };

      expect(() => Competition.create(emptyCompetitionProps)).toThrow();
      expect(() => Team.create(emptyTeamProps)).toThrow();
    });

    it('should handle unicode characters in names consistently', () => {
      const unicodeCompetition = Competition.create({
        id: CompetitionId.create(1),
        name: 'Футбольная Лига 🏆',
        url: 'https://example.com',
        version: '1.0',
      });

      const unicodeTeam = Team.create({
        id: TeamId.create('123-ABC'),
        name: 'Спартак Москва ⚽',
        url: 'https://example.com',
      });

      expect(unicodeCompetition.getName()).toBe('Футбольная Лига 🏆');
      expect(unicodeTeam.getName()).toBe('Спартак Москва ⚽');
    });
  });

  describe('Event sourcing integration', () => {
    it('should track events independently for each entity type', () => {
      const competition = Competition.create({
        id: CompetitionId.create(1),
        name: 'Test Competition',
        url: 'https://example.com',
        version: '1.0',
      });

      const team = Team.create({
        id: TeamId.create('123-ABC'),
        name: 'Test Team',
        url: 'https://example.com',
      });

      // Each entity should have exactly one event
      expect(competition.getUncommittedEvents()).toHaveLength(1);
      expect(team.getUncommittedEvents()).toHaveLength(1);

      // Events should contain correct data
      const competitionEvent =
        competition.getUncommittedEvents()[0] as CompetitionCreatedEvent;
      const teamEvent = team.getUncommittedEvents()[0] as TeamCreatedEvent;

      expect(competitionEvent.competition.name).toBe('Test Competition');
      expect(teamEvent.team.name).toBe('Test Team');
    });

    it('should commit events independently', () => {
      const competition = Competition.create({
        id: CompetitionId.create(1),
        name: 'Test Competition',
        url: 'https://example.com',
        version: '1.0',
      });

      const team = Team.create({
        id: TeamId.create('123-ABC'),
        name: 'Test Team',
        url: 'https://example.com',
      });

      // Commit events for competition only
      competition.commit();

      expect(competition.getUncommittedEvents()).toHaveLength(0);
      expect(team.getUncommittedEvents()).toHaveLength(1);
    });
  });
});
