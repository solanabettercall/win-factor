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

@Injectable()
export class MatchRepository implements IMatchRepository {
  private readonly logger = new Logger(MatchRepository.name);

  constructor(
    @InjectModel(MatchModel.name)
    private matchModel: Model<MatchDocument>,
  ) {}

  async upsert(event: PlayByPlayEvent): Promise<void> {
    const plain = instanceToPlain(event);
    const filter = { matchId: event.matchId };
    const update = { $set: plain };
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
}
