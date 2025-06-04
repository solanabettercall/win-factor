import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { GetTeamDto } from 'src/parser/sites/volleystation/dtos/get-team.dto';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { PlayerProfile } from 'src/parser/sites/volleystation/models/player-profile/player-profile';
import { GetPlayerDto } from 'src/parser/sites/volleystation/dtos/get-player.dto';
import { RawMatch } from 'src/parser/sites/volleystation/models/match-list/raw-match';
import { GetMatchesDto } from 'src/parser/sites/volleystation/dtos/get-matches.dto';
import { Player } from 'src/parser/sites/volleystation/models/team-roster/player';
import { CompetitionRepository } from './competition.repository';
import { Team } from './schemas/team.schema';

@Injectable()
export class CompetitionService {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {}

  createCompetition(competition: Competition): Observable<Competition> {
    return this.competitionRepository.upsertCompetition(competition);
  }

  getCompetitions(): Observable<Competition[]> {
    return this.competitionRepository.findAll();
  }

  getCompetitionById(id: number): Observable<Competition> {
    return this.competitionRepository.findById(id).pipe(
      switchMap((competition) => {
        if (!competition) {
          return throwError(
            () => new NotFoundException(`Турнир ${id} не найден`),
          );
        }
        return [competition];
      }),
    );
  }

  // getCompetitions(): Observable<Competition[]> {
  //   return this.volleystationCacheService.getCompetitions();
  // }

  // getCompetitionById(id: number): Observable<Competition> {
  //   return this.volleystationCacheService.getCompetitions().pipe(
  //     map((competitions) => {
  //       const c = competitions.find((c) => c.id === id);
  //       if (!c) throw new NotFoundException(`Турнир ${id} не найден`);
  //       return c;
  //     }),
  //   );
  // }

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
