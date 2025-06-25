import { Injectable, NotFoundException } from '@nestjs/common';
import { PlayerMonitoringDto } from './dtos/player-to-monitoring-dto';
import { map, Observable, of, switchMap } from 'rxjs';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { GetTeamDto } from 'src/parser/sites/volleystation/dtos/get-team.dto';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { PlayerProfile } from 'src/parser/sites/volleystation/models/player-profile/player-profile';
import { GetPlayerDto } from 'src/parser/sites/volleystation/dtos/get-player.dto';
import { RawMatch } from 'src/parser/sites/volleystation/models/match-list/raw-match';
import { GetMatchesDto } from 'src/parser/sites/volleystation/dtos/get-matches.dto';
import { Player } from 'src/parser/sites/volleystation/models/team-roster/player';
import { MonitoringRepository } from './monitoring.repository';
import { Competition } from './schemas/competition.schema';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly monitoringRepository: MonitoringRepository,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {}

  addToMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    return this.monitoringRepository.addPlayerToMonitoring(dto);
  }

  removeFromMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    return this.monitoringRepository.removePlayerFromMonitoring(dto);
  }

  getMonitoredCompetitions(): Observable<Competition[]> {
    return this.monitoringRepository.getMonitoredCompetitions();
  }

  getMonitoredTeams(competition: ICompetition): Observable<Team[]> {
    return this.monitoringRepository.getMonitoredTeamIds(competition.id).pipe(
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

  getMonitoredPlayers(
    competition: ICompetition,
    teamId: string,
  ): Observable<Player[]> {
    return this.monitoringRepository
      .getMonitoredPlayerIds({
        tournamentId: competition.id,
        teamId,
      })
      .pipe(
        switchMap((monitoredIds) => {
          if (!monitoredIds.length) return of([]);
          return this.volleystationCacheService
            .getPlayers(competition)
            .pipe(
              map((allPlayers) =>
                allPlayers.filter((player) => monitoredIds.includes(player.id)),
              ),
            );
        }),
      );
  }

  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean> {
    return this.monitoringRepository.isPlayerMonitored(dto);
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
