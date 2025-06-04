import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, map, Observable } from 'rxjs';
import { IPlayerRepository } from './interfaces/player-repository.interface';
import { Player, PlayerDocument } from './schemas/player.schema';

@Injectable()
export class PlayerRepository implements IPlayerRepository {
  private readonly logger = new Logger(PlayerRepository.name);

  constructor(
    @InjectModel(Player.name)
    private playerModel: Model<PlayerDocument>,
  ) {}

  upsert(player: Player): Observable<Player> {
    return from(
      this.playerModel
        .findOneAndUpdate(
          { id: player.id },
          { $set: player },
          { upsert: true, new: true },
        )
        .exec(),
    );
  }

  findAll(competitionId: number): Observable<Player[]> {
    return from(
      this.playerModel
        .find()
        .populate({
          path: 'competition',
          match: { id: competitionId },
        })
        .exec(),
    ).pipe(map((players) => players.filter((p) => !!p.competition)));
  }

  findById(competitionId: number, id: number): Observable<Player | null> {
    return from(
      this.playerModel
        .findOne({ id })
        .populate({
          path: 'competition',
          match: { id: competitionId },
        })
        .exec(),
    ).pipe(map((player) => (player && player.competition ? player : null)));
  }
}
