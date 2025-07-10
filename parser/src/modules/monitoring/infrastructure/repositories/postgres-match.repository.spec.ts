import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostgresMatchRepository } from './postgres-match.repository';
import { MatchEntity } from '../entities/match.entity';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';

describe('PostgresMatchRepository', () => {
  let repository: PostgresMatchRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<MatchEntity>>;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresMatchRepository,
        {
          provide: getRepositoryToken(MatchEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<PostgresMatchRepository>(PostgresMatchRepository);
    mockTypeOrmRepository = module.get(getRepositoryToken(MatchEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return null when match not found', async () => {
      // Arrange
      const matchId = MatchId.create(1);
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(matchId);

      // Assert
      expect(result).toBeNull();
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: matchId.value },
        relations: ['homeTeam', 'awayTeam'],
      });
    });

    it('should return match when found', async () => {
      // Arrange
      const matchId = MatchId.create(1);
      const matchEntity = new MatchEntity();
      matchEntity.id = 1;
      matchEntity.matchUrl = 'https://example.com/match/1';
      matchEntity.homeTeam = null;
      matchEntity.awayTeam = null;

      mockTypeOrmRepository.findOne.mockResolvedValue(matchEntity);

      // Act
      const result = await repository.findById(matchId);

      // Assert
      expect(result).toBeInstanceOf(Match);
      expect(result?.getId().value).toBe(matchId.value);
      expect(result?.getMatchUrl()).toBe('https://example.com/match/1');
    });
  });

  describe('save', () => {
    it('should save match successfully', async () => {
      // Arrange
      const match = Match.create({
        id: MatchId.create(1),
        url: 'https://example.com/match/1',
      });

      const expectedEntity = new MatchEntity();
      expectedEntity.id = 1;
      expectedEntity.matchUrl = 'https://example.com/match/1';
      expectedEntity.homeTeam = null;
      expectedEntity.awayTeam = null;

      mockTypeOrmRepository.save.mockResolvedValue(expectedEntity);

      // Act
      await repository.save(match);

      // Assert
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          matchUrl: 'https://example.com/match/1',
        }),
      );
    });
  });
});
