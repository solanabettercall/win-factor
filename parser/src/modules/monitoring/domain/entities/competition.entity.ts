import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { BadRequestException, Logger } from '@nestjs/common';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { Team, ITeam } from './team.entity';
import { TeamId } from '../value-objects/team-id.vo';
import { IPlayer, Player } from './player.entity';
import { PlayerId } from '../value-objects/player-id.vo';
import { IMatchProps, Match } from './match.entity';
import { MatchId } from '../value-objects/match-id.vo';
import { CompetitionVersion } from '../value-objects/competition-version.vo';

export interface ICompetitionProps {
  id: CompetitionId;
  name: string;
  url: string;
  version: CompetitionVersion;
}

interface ICompetition extends ICompetitionProps {
  teams: Team[];
  players: Player[];
  matches: Match[];
}

export class Competition extends BaseEntity<CompetitionId, ICompetition> {
  private readonly logger = new Logger(this.constructor.name);

  private constructor(props: ICompetitionProps) {
    const competition: ICompetition = {
      ...props,
      matches: [],
      players: [],
      teams: [],
    };
    super(props.id, competition);
    this.apply(new CompetitionCreatedEvent(competition));
  }

  public static validate(props: ICompetitionProps) {
    if (props.name.length < 1) {
      throw new BadRequestException(`Название турнира не должено быть пустым`);
    }
  }

  public static create(props: ICompetitionProps) {
    Competition.validate(props);

    return new Competition(props);
  }

  public upsertPlayer(props: IPlayer): void {
    const existingPlayerIndex = this.props.players.findIndex((t) =>
      t.id.equals(props.id),
    );
    if (existingPlayerIndex !== -1) {
      // Обновляем существующего игрока
      this.props.players[existingPlayerIndex] = Player.create(props);
    } else {
      // Добавляем нового игрока
      const player = Player.create(props);
      this.props.players.push(player);

      const playerEvents = player.getUncommittedEvents();
      playerEvents.forEach((event) => this.apply(event));
      player.commit();
    }

    this.markAsUpdated();
  }

  public addPlayers(props: IPlayer[]): void {
    props.forEach((playerProps) => {
      try {
        this.upsertPlayer(playerProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить игрока: ${error.message}`);
      }
    });
  }

  public removePlayer(id: PlayerId): void {
    const playerIndex = this.props.players.findIndex((t) => t.id.equals(id));

    if (playerIndex === -1) {
      throw new BadRequestException(`Команда с ID ${id} не найдена в турнире`);
    }

    this.props.players.splice(playerIndex, 1);
    this.markAsUpdated();
  }

  public getPlayers(): readonly Player[] {
    return [...this.props.players];
  }

  public getPlayerCount(): number {
    return this.props.players.length;
  }

  public hasPlayer(id: PlayerId): boolean {
    return this.props.players.some((t) => t.id.equals(id));
  }

  public upsertTeam(teamProps: ITeam): void {
    const existingTeamIndex = this.props.teams.findIndex((t) =>
      t.getId().equals(teamProps.id),
    );
    if (existingTeamIndex !== -1) {
      // Обновляем существующую команду
      this.props.teams[existingTeamIndex] = Team.create(teamProps);
    } else {
      // Добавляем новую команду
      const team = Team.create(teamProps);
      this.props.teams.push(team);

      const teamEvents = team.getUncommittedEvents();
      teamEvents.forEach((event) => this.apply(event));
      team.commit();
    }

    this.markAsUpdated();
  }

  public addTeams(teamsProps: ITeam[]): void {
    teamsProps.forEach((teamProps) => {
      try {
        this.upsertTeam(teamProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить команду: ${error.message}`);
      }
    });
  }

  public removeTeam(teamId: TeamId): void {
    const teamIndex = this.props.teams.findIndex((t) =>
      t.getId().equals(teamId),
    );
    if (teamIndex === -1) {
      throw new BadRequestException(
        `Команда с ID ${teamId.value} не найдена в турнире`,
      );
    }

    this.props.teams.splice(teamIndex, 1);
    this.markAsUpdated();
  }

  public getTeams(): readonly Team[] {
    return [...this.props.teams];
  }

  public getTeamCount(): number {
    return this.props.teams.length;
  }

  public hasTeam(teamId: TeamId): boolean {
    return this.props.teams.some((t) => t.getId().equals(teamId));
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

  public upsertMatch(matchProps: IMatchProps): void {
    const existingMatchIndex = this.props.matches.findIndex((t) =>
      t.id.equals(matchProps.id),
    );
    if (existingMatchIndex !== -1) {
      // Обновляем существующий матч
      this.props.matches[existingMatchIndex] = Match.create(matchProps);
    } else {
      // Добавляем новый матч
      const match = Match.create(matchProps);
      this.props.matches.push(match);

      const matchEvents = match.getUncommittedEvents();
      matchEvents.forEach((event) => this.apply(event));
      match.commit();
    }

    this.markAsUpdated();
  }

  public addMatches(matchesProps: IMatchProps[]): void {
    matchesProps.forEach((matchProps) => {
      try {
        this.upsertMatch(matchProps);
      } catch (error) {
        this.logger.warn(`Не удалось добавить матч: ${error.message}`);
      }
    });
  }

  public getMatchCount(): number {
    return this.props.matches.length;
  }

  public removeMatch(matchId: MatchId): void {
    const matchIndex = this.props.matches.findIndex((match) =>
      match.getId().equals(matchId),
    );
    if (matchIndex === -1) {
      throw new BadRequestException(`Матч с ID ${matchId} не найден в турнире`);
    }

    this.props.matches.splice(matchIndex, 1);
    this.markAsUpdated();
  }
  public getMatches(): readonly Match[] {
    return [...this.props.matches];
  }

  public hasMatch(matchId: MatchId): boolean {
    return this.props.matches.some((m) => m.getId().equals(matchId));
  }

  public getVersion(): CompetitionVersion {
    return this.props.version;
  }
}
