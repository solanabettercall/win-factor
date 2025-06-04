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

  // getMonitoredTeams(competition: ICompetition): Observable<Team[]> {
  //   return this.teamRepository.getMonitoredTeamIds(competition.id).pipe(
  //     switchMap((ids) => {
  //       if (!ids.length) {
  //         return of([]);
  //       }
  //       return this.getTeams(competition).pipe(
  //         map((teams) => teams.filter((c) => ids.includes(c.id))),
  //       );
  //     }),
  //   );
  // }

  createPlayer(player: Player): Observable<Player> {
    return this.playerRepository.upsert(player);
  }

  getPlayer(competition: Competition, id: number): Observable<Player> {
    return from(
      this.competitionModel.findOne({ id: competition.id }).exec(),
    ).pipe(
      switchMap((competitionDoc) => {
        if (!competitionDoc) {
          throw new NotFoundException(`Турнир ${competition.id} не найден`);
        }
        return this.volleystationCacheService.getPlayers(competition).pipe(
          map((players) => {
            const player = players.find((player) => player.id === id);
            if (!player) {
              throw new NotFoundException(`Игрок ${id} не найден`);
            }
            player.competition = competitionDoc;
            return player;
          }),
        );
      }),
    );
  }

  getPlayers(competition: ICompetition): Observable<Team[]> {
    return this.volleystationCacheService.getTeams(competition);
  }
}
