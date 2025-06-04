import { Injectable, NotFoundException } from '@nestjs/common';
import { map, Observable, of, switchMap } from 'rxjs';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { GetTeamDto } from 'src/parser/sites/volleystation/dtos/get-team.dto';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { Team } from './schemas/team.schema';
import { TeamRepository } from './team.repository';

@Injectable()
export class TeamService {
  constructor(
    private readonly teamRepository: TeamRepository,
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

  createTeam(team: Team): Observable<Team> {
    return this.teamRepository.upsert(team);
  }

  // getTeamById(competition: Competition, id: string): Observable<Team> {
  //   return this.volleystationCacheService.getTeams(competition).pipe(
  //     map((teams) => {
  //       const team = teams.find((team) => team.id === id);
  //       if (!team) throw new NotFoundException(`Команда ${id} не найдена`);
  //       return team;
  //     }),
  //   );
  // }

  // getTeamById(competition: Competition, id: string): Observable<Team> {
  //   return this.teamRepository.findById(competition.id, id).pipe(
  //     map((player) => {
  //       if (!player) {
  //         throw new NotFoundException(`Игрок ${id} не найден`);
  //       }
  //       return player;
  //     }),
  //   );
  // }

  // getTeams(competition: ICompetition): Observable<Team[]> {
  //   return this.volleystationCacheService.getTeams(competition);
  // }

  // getTeam(dto: GetTeamDto): Observable<TeamRoster> {
  //   return this.volleystationCacheService.getTeam(dto);
  // }

  getTeam(competition: Competition, id: string): Observable<Team> {
    return this.teamRepository.findById(competition.id, id).pipe(
      map((team) => {
        if (!team) {
          throw new NotFoundException(`Команда ${id} не найдена`);
        }
        return team;
      }),
    );
  }

  getTeams(competition: Competition): Observable<Team[]> {
    return this.teamRepository.findAll(competition.id);
  }
}
