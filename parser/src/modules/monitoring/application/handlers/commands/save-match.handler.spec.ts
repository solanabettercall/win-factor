import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { SaveMatchCommandHandler } from './save-match.handler';
import { SaveMatchCommand } from '../../commands/save-match.command';
import { MATCH_REPOSITORY } from '../../../domain/repositories/match.repository.interface';
import { Match } from '../../../domain/entities/match.entity';
import { MatchId } from '../../../domain/value-objects/match-id.vo';

describe('SaveMatchCommandHandler', () => {
  let handler: SaveMatchCommandHandler;
  let mockRepository: any;
  let mockEventPublisher: any;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
    };

    mockEventPublisher = {
      mergeObjectContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveMatchCommandHandler,
        {
          provide: MATCH_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<SaveMatchCommandHandler>(SaveMatchCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should save match and publish events', async () => {
    // Arrange
    const match = Match.create({
      id: MatchId.create(1),
      url: 'https://example.com/match/1',
    });

    // Mock the commit method
    jest.spyOn(match, 'commit').mockImplementation(() => {});

    const command = new SaveMatchCommand(match);

    // Act
    await handler.execute(command);

    // Assert
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalledWith(match);
    expect(mockRepository.save).toHaveBeenCalledWith(match);
    expect(match.commit).toHaveBeenCalled();
  });
});
