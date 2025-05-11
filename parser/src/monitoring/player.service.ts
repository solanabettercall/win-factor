import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PlayerMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IPlayerRepository } from './interfaces/player-repository.interface';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerRepositoryToken } from './player-repository.token';
import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { GetTeamDto } from 'src/parser/sites/volleystation/dtos/get-team.dto';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { PlayerProfile } from 'src/parser/sites/volleystation/models/player-profile/player-profile';
import { GetPlayerDto } from 'src/parser/sites/volleystation/dtos/get-player.dto';
import { RawMatch } from 'src/parser/sites/volleystation/models/match-list/raw-match';
import { GetMatchesDto } from 'src/parser/sites/volleystation/dtos/get-matches.dto';
import { Player } from 'src/parser/sites/volleystation/models/team-roster/player';

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PlayerRepositoryToken)
    private readonly playerRepository: IPlayerRepository,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
  async run() {
    // const [competition] = await firstValueFrom(this.getCompetitions());
    // console.log(competition);
    // const [team] = await firstValueFrom(this.getTeams(competition));
    // console.log(team);
    // const teamRoster = await firstValueFrom(
    //   this.getTeam({ competition, teamId: team.id }),
    // );
    // const [player] = teamRoster.players;
    // const playerProfile = await firstValueFrom(
    //   this.getPlayer({ competition, playerId: player.id }),
    // );
    // console.log(playerProfile);
    // await firstValueFrom(
    //   this.addToMonitoring({
    //     playerId: 2106014,
    //     teamId: '2100412-43076',
    //     tournamentId: 118,
    //   }),
    // );
    // const monitoredCompetitions = await firstValueFrom(
    //   this.getMonitoredCompetitions(),
    // );
    // // console.log(monitoredCompetitions);
    // const monitoredTeams = await firstValueFrom(
    //   this.getMonitoredTeams(monitoredCompetitions[0]),
    // );
    // console.log(monitoredTeams);
  }

  addToMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    return this.playerRepository.addPlayerToMonitoring(dto);
  }

  removeFromMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    return this.playerRepository.removePlayerFromMonitoring(dto);
  }

  getMonitoredCompetitions(): Observable<Competition[]> {
    return this.playerRepository.getMonitoredCompetitionIds().pipe(
      switchMap((ids) => {
        if (!ids.length) {
          return of([]);
        }
        return this.getCompetitions().pipe(
          map((competitions) => competitions.filter((c) => ids.includes(c.id))),
        );
      }),
    );
  }

  getMonitoredTeams(competition: ICompetition): Observable<Team[]> {
    return this.playerRepository.getMonitoredTeamIds(competition.id).pipe(
      switchMap((ids) => {
        if (!ids.length) {
          return of([]);
        }
        return this.getTeams(competition).pipe(
          map((teams) => teams.filter((c) => ids.includes(c.id))),
        );
      }),
    );
  }

  // getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]> {
  //   return this.playerRepository.getMonitoredPlayerIds(dto);
  // }

  // getMonitoredPlayers(competition: ICompetition): Observable<Player[]> {
  //   return this.playerRepository.getMonitoredTeamIds(competition.id).pipe(
  //     switchMap((ids) => {
  //       if (!ids.length) {
  //         return of([]);
  //       }
  //       return this.getTeam(competition).pipe(
  //         map((teams) => teams.filter((c) => ids.includes(c.id))),
  //       );
  //     }),
  //   );
  // }

  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean> {
    return this.playerRepository.isPlayerMonitored(dto);
  }

  getCompetitions(): Observable<Competition[]> {
    return this.volleystationCacheService.getCompetitions();
  }

  getCompetitionById(id: number): Observable<Competition> {
    return this.volleystationCacheService.getCompetitions().pipe(
      map((competitions) => {
        const c = competitions.find((c) => c.id === id);
        if (!c) throw new NotFoundException(`Турнир ${id} не найден`);
        return c;
      }),
    );
  }

  getTeamById(competition: Competition, id: string): Observable<Team> {
    return this.volleystationCacheService.getTeams(competition).pipe(
      map((teams) => {
        const team = teams.find((team) => team.id === id);
        if (!team) throw new NotFoundException(`Команда ${id} не найдена`);
        return team;
      }),
    );
  }

  getPlayerById(competition: Competition, id: number): Observable<Player> {
    return this.volleystationCacheService.getPlayers(competition).pipe(
      map((players) => {
        const player = players.find((player) => player.id === id);
        if (!player) throw new NotFoundException(`Игрок ${id} не найден`);
        return player;
      }),
    );
  }

  getTeams(competition: ICompetition): Observable<Team[]> {
    return this.volleystationCacheService.getTeams(competition);
  }

  getTeam(dto: GetTeamDto): Observable<TeamRoster> {
    return this.volleystationCacheService.getTeam(dto);
  }

  getPlayer(dto: GetPlayerDto): Observable<PlayerProfile> {
    return this.volleystationCacheService.getPlayer(dto);
  }

  getPlayers(competition: ICompetition): Observable<Player[]> {
    return this.volleystationCacheService.getPlayers(competition);
  }

  getMatches(dto: GetMatchesDto): Observable<RawMatch[]> {
    return this.volleystationCacheService.getMatches(dto);
  }
}
