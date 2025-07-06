import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICompetitionRepository } from './interfaces/competition-repository.interface';
import { Competition, CompetitionDocument } from './schemas/competition.schema';
import { from, map, Observable, tap } from 'rxjs';
import { IMatchRepository } from './interfaces/match-repository.interface';
import { MatchDocument, MatchModel } from './schemas/match.schema';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UpcomingMatcheDto } from './dtos/upcoming-match.dto';

@Injectable()
export class MatchRepository implements IMatchRepository {
  private readonly logger = new Logger(MatchRepository.name);

  constructor(
    @InjectModel(MatchModel.name)
    private matchModel: Model<MatchDocument>,
  ) {}

  async upsert(
    competition: Competition,
    event: PlayByPlayEvent,
  ): Promise<void> {
    const plain = instanceToPlain(event);
    const filter = { matchId: event.matchId };
    const update = {
      $set: {
        ...plain,
        competitionId: competition.id,
      },
    };
    const options = { upsert: true };

    this.logger.debug(`Upserting match ${event.matchId}`);

    await this.matchModel.updateOne(filter, update, options);
  }

  get(id: string): Observable<PlayByPlayEvent> {
    return from(this.matchModel.findOne({ matchId: id }).lean()).pipe(
      map((doc) => {
        if (!doc) {
          throw new Error(`Match with matchId=${id} not found`);
        }
        return plainToInstance(PlayByPlayEvent, doc);
      }),
    );
  }
  getToday(): Observable<UpcomingMatcheDto[]> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    return from(
      this.matchModel
        .aggregate([
          {
            $match: {
              startDate: {
                $gte: startOfDay,
                $lt: endOfDay,
              },
            },
          },
          {
            $lookup: {
              from: 'competitions',
              localField: 'competitionId',
              foreignField: 'id',
              as: 'competition',
            },
          },
          {
            $unwind: '$competition',
          },
        ])
        .exec(),
    ).pipe(
      map((docs: any[]): UpcomingMatcheDto[] =>
        docs.map((doc) => ({
          event: plainToInstance(PlayByPlayEvent, doc),
          competition: plainToInstance(Competition, doc.competition),
        })),
      ),
    );
  }

  getAll(): Observable<UpcomingMatcheDto[]> {
    return from(
      this.matchModel
        .aggregate([
          {
            $lookup: {
              from: 'competitions', // имя коллекции, Mongo использует строчные и множественные
              localField: 'competitionId',
              foreignField: 'id',
              as: 'competition',
            },
          },
          {
            $unwind: '$competition', // разворачиваем массив в объект
          },
        ])
        .exec(),
    ).pipe(
      map((docs: any[]): UpcomingMatcheDto[] =>
        docs.map((doc) => ({
          event: plainToInstance(PlayByPlayEvent, doc),
          competition: plainToInstance(Competition, doc.competition),
        })),
      ),
    );
  }
}
