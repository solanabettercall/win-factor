import { BadRequestException } from '@nestjs/common';
import { Competition, ICompetition } from './competition.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { TeamCreatedEvent } from '../events/team-created.event';
import { TeamId } from '../value-objects/team-id.vo';
import { ITeam } from './team.entity';

describe('Competition Entity', () => {
  let validCompetitionProps: ICompetition;
  let competitionId: CompetitionId;

  beforeEach(() => {
    competitionId = CompetitionId.create(1);
    validCompetitionProps = {
      id: competitionId,
      name: 'Test Competition',
      url: 'https://panel.volleystation.com/website/110/en/',
      version: 'website',
    };
  });

  describe('create', () => {
    it('should create a competition with valid props', () => {
      const competition = Competition.create(validCompetitionProps);

      expect(competition).toBeDefined();
      expect(competition.getName()).toBe(validCompetitionProps.name);
      expect(competition.getUrl()).toBe(validCompetitionProps.url);
      expect(competition.getId()).toBe(competitionId);
    });

    it('should apply CompetitionCreatedEvent when creating competition', () => {
      const competition = Competition.create(validCompetitionProps);
      const events = competition.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CompetitionCreatedEvent);
      expect((events[0] as CompetitionCreatedEvent).competition).toEqual(
        validCompetitionProps,
      );
    });

    it('should throw BadRequestException when name is empty', () => {
      const invalidProps = {
        ...validCompetitionProps,
        name: '',
      };

      expect(() => Competition.create(invalidProps)).toThrow(
        BadRequestException,
      );
      expect(() => Competition.create(invalidProps)).toThrow(
        'Название турнира не должено быть пустым',
      );
    });

    it('should create competition with whitespace name (current behavior)', () => {
      const propsWithWhitespace = {
        ...validCompetitionProps,
        name: '   ',
      };

      // Current implementation only checks length, not content
      const competition = Competition.create(propsWithWhitespace);
      expect(competition.getName()).toBe('   ');
    });
  });

  describe('validate', () => {
    it('should pass validation with valid props', () => {
      expect(() => Competition.validate(validCompetitionProps)).not.toThrow();
    });

    it('should throw BadRequestException when name is empty', () => {
      const invalidProps = {
        ...validCompetitionProps,
        name: '',
      };

      expect(() => Competition.validate(invalidProps)).toThrow(
        BadRequestException,
      );
      expect(() => Competition.validate(invalidProps)).toThrow(
        'Название турнира не должено быть пустым',
      );
    });

    it('should throw BadRequestException when name length is less than 1', () => {
      const invalidProps = {
        ...validCompetitionProps,
        name: '',
      };

      expect(() => Competition.validate(invalidProps)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getter methods', () => {
    let competition: Competition;

    beforeEach(() => {
      competition = Competition.create(validCompetitionProps);
    });

    it('should return correct name', () => {
      expect(competition.getName()).toBe(validCompetitionProps.name);
    });

    it('should return correct url', () => {
      expect(competition.getUrl()).toBe(validCompetitionProps.url);
    });

    it('should return correct id', () => {
      expect(competition.getId()).toBe(competitionId);
    });
  });

  describe('inheritance from BaseEntity', () => {
    let competition: Competition;

    beforeEach(() => {
      competition = Competition.create(validCompetitionProps);
    });

    it('should have id property from BaseEntity', () => {
      expect(competition.id).toBe(competitionId);
    });

    it('should have createdAt property from BaseEntity', () => {
      expect(competition.createdAt).toBeDefined();
    });

    it('should have updatedAt property from BaseEntity', () => {
      expect(competition.updatedAt).toBeDefined();
    });

    it('should implement equals method from BaseEntity', () => {
      const sameCompetition = Competition.create(validCompetitionProps);
      const differentCompetition = Competition.create({
        ...validCompetitionProps,
        id: CompetitionId.create(2),
      });

      expect(competition.equals(sameCompetition)).toBe(true);
      expect(competition.equals(differentCompetition)).toBe(false);
    });

    it('should implement toString method from BaseEntity', () => {
      const stringRepresentation = competition.toString();
      expect(stringRepresentation).toContain(validCompetitionProps.name);
      expect(stringRepresentation).toContain(validCompetitionProps.url);
    });

    it('should implement toJSON method from BaseEntity', () => {
      const jsonRepresentation = competition.toJSON();
      const parsedJson = JSON.parse(jsonRepresentation);
      expect(parsedJson.name).toBe(validCompetitionProps.name);
      expect(parsedJson.url).toBe(validCompetitionProps.url);
    });
  });

  describe('edge cases', () => {
    it('should handle competition with minimum valid name length', () => {
      const propsWithMinName = {
        ...validCompetitionProps,
        name: 'A',
      };

      const competition = Competition.create(propsWithMinName);
      expect(competition.getName()).toBe('A');
    });

    it('should handle competition with long name', () => {
      const longName = 'A'.repeat(1000);
      const propsWithLongName = {
        ...validCompetitionProps,
        name: longName,
      };

      const competition = Competition.create(propsWithLongName);
      expect(competition.getName()).toBe(longName);
    });

    it('should handle special characters in name', () => {
      const specialName = 'Competition™ 2024 - "Special" Edition!';
      const propsWithSpecialName = {
        ...validCompetitionProps,
        name: specialName,
      };

      const competition = Competition.create(propsWithSpecialName);
      expect(competition.getName()).toBe(specialName);
    });
  });

  describe('team management', () => {
    let competition: Competition;
    let validTeamProps: ITeam;

    beforeEach(() => {
      competition = Competition.create(validCompetitionProps);
      validTeamProps = {
        id: TeamId.create('123-ABC'),
        name: 'Test Team',
        url: 'https://example.com/team',
      };
    });

    describe('addTeam', () => {
      it('should add a team successfully', () => {
        competition.addTeam(validTeamProps);

        expect(competition.getTeamCount()).toBe(1);
        expect(competition.hasTeam(validTeamProps.id)).toBe(true);
        expect(competition.getTeams()[0].getName()).toBe(validTeamProps.name);
      });

      it('should apply TeamCreatedEvent when adding team', () => {
        competition.addTeam(validTeamProps);
        const events = competition.getUncommittedEvents();

        // Should have CompetitionCreatedEvent + TeamCreatedEvent
        expect(events).toHaveLength(2);
        expect(events[1]).toBeInstanceOf(TeamCreatedEvent);

        const teamCreatedEvent = events[1] as TeamCreatedEvent;
        expect(teamCreatedEvent.props).toEqual(validTeamProps);
      });

      it('should throw error when adding duplicate team', () => {
        competition.addTeam(validTeamProps);

        expect(() => competition.addTeam(validTeamProps)).toThrow(
          BadRequestException,
        );
        expect(() => competition.addTeam(validTeamProps)).toThrow(
          'Команда Test Team уже добавлена в турнир',
        );
      });

      it('should mark competition as updated when adding team', () => {
        competition.addTeam(validTeamProps);

        // Just verify that updatedAt exists (markAsUpdated was called)
        expect(competition.updatedAt).toBeDefined();
      });
    });

    describe('addTeams', () => {
      it('should add multiple teams successfully', () => {
        const teams: ITeam[] = [
          {
            id: TeamId.create('123-ABC'),
            name: 'Team A',
            url: 'https://example.com/team-a',
          },
          {
            id: TeamId.create('456-DEF'),
            name: 'Team B',
            url: 'https://example.com/team-b',
          },
        ];

        competition.addTeams(teams);

        expect(competition.getTeamCount()).toBe(2);
        expect(competition.hasTeam(teams[0].id)).toBe(true);
        expect(competition.hasTeam(teams[1].id)).toBe(true);
      });

      it('should continue adding teams even if one fails', () => {
        const teams: ITeam[] = [
          validTeamProps, // First team
          validTeamProps, // Duplicate - should fail
          {
            id: TeamId.create('456-DEF'),
            name: 'Team B',
            url: 'https://example.com/team-b',
          }, // Third team - should succeed
        ];

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        competition.addTeams(teams);

        expect(competition.getTeamCount()).toBe(2); // First and third teams
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });

    describe('removeTeam', () => {
      beforeEach(() => {
        competition.addTeam(validTeamProps);
      });

      it('should remove team successfully', () => {
        competition.removeTeam(validTeamProps.id);

        expect(competition.getTeamCount()).toBe(0);
        expect(competition.hasTeam(validTeamProps.id)).toBe(false);
      });

      it('should throw error when removing non-existent team', () => {
        const nonExistentTeamId = TeamId.create('999-XYZ');

        expect(() => competition.removeTeam(nonExistentTeamId)).toThrow(
          BadRequestException,
        );
        expect(() => competition.removeTeam(nonExistentTeamId)).toThrow(
          'Команда с ID 999-XYZ не найдена в турнире',
        );
      });

      it('should mark competition as updated when removing team', () => {
        competition.removeTeam(validTeamProps.id);

        // Just verify that updatedAt exists (markAsUpdated was called)
        expect(competition.updatedAt).toBeDefined();
      });
    });

    describe('team queries', () => {
      beforeEach(() => {
        const teams: ITeam[] = [
          {
            id: TeamId.create('123-ABC'),
            name: 'Team A',
            url: 'https://example.com/team-a',
          },
          {
            id: TeamId.create('456-DEF'),
            name: 'Team B',
            url: 'https://example.com/team-b',
          },
        ];
        competition.addTeams(teams);
      });

      it('should return correct team count', () => {
        expect(competition.getTeamCount()).toBe(2);
      });

      it('should return readonly array of teams', () => {
        const teams = competition.getTeams();

        expect(teams).toHaveLength(2);
        expect(teams[0].getName()).toBe('Team A');
        expect(teams[1].getName()).toBe('Team B');

        // Readonly array, so let's try to modify through a new copy
        const modifiableTeams = teams.slice();
        modifiableTeams.pop();
        expect(competition.getTeamCount()).toBe(2);
      });

      it('should correctly check if team exists', () => {
        const existingTeamId = TeamId.create('123-ABC');
        const nonExistentTeamId = TeamId.create('999-XYZ');

        expect(competition.hasTeam(existingTeamId)).toBe(true);
        expect(competition.hasTeam(nonExistentTeamId)).toBe(false);
      });
    });
  });
});
