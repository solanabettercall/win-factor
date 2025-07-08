import { BadRequestException } from '@nestjs/common';
import { Competition, ICompetition } from './competition.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { CompetitionCreatedEvent } from '../events/competition-created.event';

describe('Competition Entity', () => {
  let validCompetitionProps: ICompetition;
  let competitionId: CompetitionId;

  beforeEach(() => {
    competitionId = CompetitionId.create(110);
    validCompetitionProps = {
      id: competitionId,
      name: 'Testliga Women',
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
});
