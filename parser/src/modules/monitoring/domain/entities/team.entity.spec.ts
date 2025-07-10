import { BadRequestException } from '@nestjs/common';
import { Team, ITeam } from './team.entity';
import { TeamId } from '../value-objects/team-id.vo';
import { TeamCreatedEvent } from '../events/team-created.event';

describe('Team Entity', () => {
  let validTeamProps: ITeam;
  let teamId: TeamId;

  beforeEach(() => {
    teamId = TeamId.create('2100423-36455');
    validTeamProps = {
      id: teamId,
      name: 'ASKÖ Volksbank Purgstall',
      url: 'https://panel.volleystation.com/website/110/en/teams/2100423-36455/',
    };
  });

  describe('create', () => {
    it('should create a team with valid props', () => {
      const team = Team.create(validTeamProps);

      expect(team).toBeDefined();
      expect(team.getName()).toBe(validTeamProps.name);
      expect(team.getId()).toBe(teamId);
    });

    it('should apply TeamCreatedEvent when creating team', () => {
      const team = Team.create(validTeamProps);
      const events = team.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TeamCreatedEvent);
      expect((events[0] as TeamCreatedEvent).props).toEqual(validTeamProps);
    });

    it('should throw BadRequestException when name is empty', () => {
      const invalidProps = {
        ...validTeamProps,
        name: '',
      };

      expect(() => Team.create(invalidProps)).toThrow(BadRequestException);
      expect(() => Team.create(invalidProps)).toThrow(
        'Название команды не должено быть пустым',
      );
    });

    it('should create team with whitespace name (current behavior)', () => {
      const propsWithWhitespace = {
        ...validTeamProps,
        name: '   ',
      };

      // Current implementation only checks length, not content
      const team = Team.create(propsWithWhitespace);
      expect(team.getName()).toBe('   ');
    });
  });

  describe('validate', () => {
    it('should pass validation with valid props', () => {
      expect(() => Team.validate(validTeamProps)).not.toThrow();
    });

    it('should throw BadRequestException when name is empty', () => {
      const invalidProps = {
        ...validTeamProps,
        name: '',
      };

      expect(() => Team.validate(invalidProps)).toThrow(BadRequestException);
      expect(() => Team.validate(invalidProps)).toThrow(
        'Название команды не должено быть пустым',
      );
    });

    it('should throw BadRequestException when name length is less than 1', () => {
      const invalidProps = {
        ...validTeamProps,
        name: '',
      };

      expect(() => Team.validate(invalidProps)).toThrow(BadRequestException);
    });
  });

  describe('getter methods', () => {
    let team: Team;

    beforeEach(() => {
      team = Team.create(validTeamProps);
    });

    it('should return correct name', () => {
      expect(team.getName()).toBe(validTeamProps.name);
    });

    it('should return correct id', () => {
      expect(team.getId()).toBe(teamId);
    });
  });

  describe('inheritance from BaseEntity', () => {
    let team: Team;

    beforeEach(() => {
      team = Team.create(validTeamProps);
    });

    it('should have id property from BaseEntity', () => {
      expect(team.id).toBe(teamId);
    });

    it('should have createdAt property from BaseEntity', () => {
      expect(team.createdAt).toBeDefined();
    });

    it('should have updatedAt property from BaseEntity', () => {
      expect(team.updatedAt).toBeDefined();
    });

    it('should implement equals method from BaseEntity', () => {
      const sameTeam = Team.create(validTeamProps);
      const differentTeam = Team.create({
        ...validTeamProps,
        id: TeamId.create('456-DEF'),
      });

      expect(team.equals(sameTeam)).toBe(true);
      expect(team.equals(differentTeam)).toBe(false);
    });

    it('should implement toString method from BaseEntity', () => {
      const stringRepresentation = team.toString();
      expect(stringRepresentation).toContain(validTeamProps.name);
      expect(stringRepresentation).toContain(validTeamProps.url);
    });

    it('should implement toJSON method from BaseEntity', () => {
      const jsonRepresentation = team.toJSON();
      const parsedJson = JSON.parse(jsonRepresentation);
      expect(parsedJson.name).toBe(validTeamProps.name);
      expect(parsedJson.url).toBe(validTeamProps.url);
    });
  });

  describe('edge cases', () => {
    it('should handle team with minimum valid name length', () => {
      const propsWithMinName = {
        ...validTeamProps,
        name: 'A',
      };

      const team = Team.create(propsWithMinName);
      expect(team.getName()).toBe('A');
    });

    it('should handle team with long name', () => {
      const longName = 'A'.repeat(1000);
      const propsWithLongName = {
        ...validTeamProps,
        name: longName,
      };

      const team = Team.create(propsWithLongName);
      expect(team.getName()).toBe(longName);
    });

    it('should handle special characters in name', () => {
      const specialName = 'Team™ 2024 - "Special" Edition!';
      const propsWithSpecialName = {
        ...validTeamProps,
        name: specialName,
      };

      const team = Team.create(propsWithSpecialName);
      expect(team.getName()).toBe(specialName);
    });

    it('should handle team with different TeamId formats', () => {
      const differentTeamId = TeamId.create('999-XYZ');
      const propsWithDifferentId = {
        ...validTeamProps,
        id: differentTeamId,
      };

      const team = Team.create(propsWithDifferentId);
      expect(team.getId()).toBe(differentTeamId);
    });
  });

  describe('type safety', () => {
    it('should return Team type from create method', () => {
      const team = Team.create(validTeamProps);
      expect(team).toBeInstanceOf(Team);
    });

    it('should return string type from getName method', () => {
      const team = Team.create(validTeamProps);
      const name = team.getName();
      expect(typeof name).toBe('string');
    });

    it('should return TeamId type from getId method', () => {
      const team = Team.create(validTeamProps);
      const id = team.getId();
      expect(id).toBeInstanceOf(TeamId);
    });
  });
});
