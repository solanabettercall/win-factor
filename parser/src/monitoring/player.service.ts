import { Injectable, NotFoundException } from '@nestjs/common';
import { from, map, Observable, switchMap } from 'rxjs';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { Team } from './schemas/team.schema';
import { PlayerRepository } from './player.repository';
import { Player } from './schemas/player.schema';
import { CompetitionRepository } from './competition.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionDocument } from './schemas/competition.schema';

@Injectable()
export class PlayerService {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly competitionRepository: CompetitionRepository,
    @InjectModel(Competition.name)
    private competitionModel: Model<CompetitionDocument>,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {}

  createPlayer(player: Player): Observable<Player> {
    return this.playerRepository.upsert(player);
  }

  getPlayer(competition: Competition, id: number): Observable<Player> {
    return this.playerRepository.findById(competition.id, id).pipe(
      map((player) => {
        if (!player) {
          throw new NotFoundException(`Игрок ${id} не найден`);
        }
        return player;
      }),
    );
  }

  getPlayers(competition: Competition): Observable<Player[]> {
    return this.playerRepository.findAll(competition.id);
  }
}
