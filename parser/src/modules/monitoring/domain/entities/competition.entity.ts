import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { BadRequestException, Logger } from '@nestjs/common';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { Team, ITeam } from './team.entity';
import { TeamId } from '../value-objects/team-id.vo';
import { IPlayer, Player } from './player.entity';
import { PlayerId } from '../value-objects/player-id.vo';
import { IMatch, IMatchProps, Match } from './match.entity';
import { MatchId } from '../value-objects/match-id.vo';
import { CompetitionVersion } from '../value-objects/competition-version.vo';

export interface ICompetition {
  id: CompetitionId;
  name: string;
  url: string;
  version: CompetitionVersion;
}

export class Competition extends BaseEntity<CompetitionId, ICompetition> {
  private _teams: Team[] = [];
  private _players: Player[] = [];
  private _matches: Match[] = [];
  private readonly logger = new Logger(this.constructor.name);

  private constructor(props: ICompetition) {
    super(props.id, props);
    this.apply(new CompetitionCreatedEvent(props));
  }

  public static validate(props: ICompetition) {
    if (props.name.length < 1) {
      throw new BadRequestException(`Название турнира не должено быть пустым`);
    }
  }

  public static create(props: ICompetition) {
    Competition.validate(props);

    return new Competition(props);
  }

  public addPlayer(props: IPlayer): void {
    const existingPlayer = this._players.find((t) => t.id.equals(props.id));
    if (existingPlayer) {
      throw new BadRequestException(
        `Игрок ${props.name} уже добавлен в турнир`,
      );
    }

    const player = Player.create(props);
    this._players.push(player);

    const playerEvents = player.getUncommittedEvents();
    playerEvents.forEach((event) => this.apply(event));
    player.commit();

    this.markAsUpdated();
  }

  public addPlayers(props: IPlayer[]): void {
    props.forEach((playerProps) => {
      try {
        this.addPlayer(playerProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить игрока: ${error.message}`);
      }
    });
  }

  public removePlayer(id: PlayerId): void {
    const playerIndex = this._players.findIndex((t) => t.id.equals(id));
    if (playerIndex === -1) {
      throw new BadRequestException(`Команда с ID ${id} не найдена в турнире`);
    }

    this._players.splice(playerIndex, 1);
    this.markAsUpdated();
  }

  public getPlayers(): readonly Player[] {
    return [...this._players];
  }

  public getPlayerCount(): number {
    return this._players.length;
  }

  public hasPlayer(id: PlayerId): boolean {
    return this._players.some((t) => t.id.equals(id));
  }

  public addTeam(teamProps: ITeam): void {
    const existingTeam = this._teams.find((t) =>
      t.getId().equals(teamProps.id),
    );
    if (existingTeam) {
      throw new BadRequestException(
        `Команда ${teamProps.name} уже добавлена в турнир`,
      );
    }

    const team = Team.create(teamProps);
    this._teams.push(team);

    const teamEvents = team.getUncommittedEvents();
    teamEvents.forEach((event) => this.apply(event));
    team.commit();

    this.markAsUpdated();
  }

  public addTeams(teamsProps: ITeam[]): void {
    teamsProps.forEach((teamProps) => {
      try {
        this.addTeam(teamProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить команду: ${error.message}`);
      }
    });
  }

  public removeTeam(teamId: TeamId): void {
    const teamIndex = this._teams.findIndex((t) => t.getId().equals(teamId));
    if (teamIndex === -1) {
      throw new BadRequestException(
        `Команда с ID ${teamId.value} не найдена в турнире`,
      );
    }

    this._teams.splice(teamIndex, 1);
    this.markAsUpdated();
  }

  public getTeams(): readonly Team[] {
    return [...this._teams];
  }

  public getTeamCount(): number {
    return this._teams.length;
  }

  public hasTeam(teamId: TeamId): boolean {
    return this._teams.some((t) => t.getId().equals(teamId));
  }

  public getName() {
    return this.props.name;
  }

  public getUrl() {
    return this.props.url;
  }

  public getId() {
    return this.props.id;
  }

  public addMatch(matchProps: IMatchProps | IMatch): void {
    const existingMatch = this._matches.find((t) => t.id.equals(matchProps.id));
    if (existingMatch) {
      throw new BadRequestException(
        `Матч ${matchProps.id} уже добавлен в турнир`,
      );
    }

    const match = Match.create(matchProps);
    this._matches.push(match);

    const matchEvents = match.getUncommittedEvents();
    matchEvents.forEach((event) => this.apply(event));
    match.commit();

    this.markAsUpdated();
  }

  public addMatches(matchesProps: (IMatchProps | IMatch)[]): void {
    matchesProps.forEach((matchProps) => {
      try {
        this.addMatch(matchProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить матч: ${error.message}`);
      }
    });
  }

  public getMatchCount(): number {
    return this._matches.length;
  }

  public removeMatch(matchId: MatchId): void {
    const matchIndex = this._matches.findIndex((match) =>
      match.getId().equals(matchId),
    );
    if (matchIndex === -1) {
      throw new BadRequestException(`Матч с ID ${matchId} не найден в турнире`);
    }

    this._matches.splice(matchIndex, 1);
    this.markAsUpdated();
  }
  public getMatches(): readonly Match[] {
    return [...this._matches];
  }

  public hasMatch(matchId: MatchId): boolean {
    return this._matches.some((m) => m.getId().equals(matchId));
  }

  public getVersion(): CompetitionVersion {
    return this.props.version;
  }
}
