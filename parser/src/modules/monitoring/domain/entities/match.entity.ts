import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { MatchId } from '../value-objects/match-id.vo';
import { MatchCreatedEvent } from '../events/match-created.event';
import { TeamId } from '../value-objects/team-id.vo';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { PlayerId } from '../value-objects/player-id.vo';

export interface IStartingLineup {
  setNumber: number;
  players: PlayerId[];
}

export interface IMatchProps {
  id: MatchId;
  url: string;
  competitionId: CompetitionId;
  homeTeamId?: TeamId;
  awayTeamId?: TeamId;
  declaredPlayers?: PlayerId[];
  startingLineups?: IStartingLineup[];
}

export class Match extends BaseEntity<MatchId, IMatchProps> {
  public getCompetitionId(): CompetitionId {
    return this.props.competitionId;
  }
  private readonly logger = new Logger(this.constructor.name);

  private constructor(props: IMatchProps) {
    super(props.id, props);

    this.apply(new MatchCreatedEvent(props));
  }

  public static validate(props: IMatchProps) {
    if (!props.url || props.url.trim() === '') {
      throw new BadRequestException('Ссылка на матч обязательна');
    }
  }

  public static create(props: IMatchProps) {
    Match.validate(props);

    return new Match(props);
  }

  public getId(): MatchId {
    return this.props.id;
  }

  public getHomeTeamId(): TeamId | null {
    return this.props.homeTeamId ?? null;
  }

  public getAwayTeamId(): TeamId | null {
    return this.props.awayTeamId ?? null;
  }

  public updateHomeTeam(teamId: TeamId): void {
    if (this.props.awayTeamId?.equals(teamId)) {
      throw new BadRequestException(
        'Домашняя и гостевые команды не могут совпадать',
      );
    }

    this.props.homeTeamId = teamId;
    this.markAsUpdated();
  }

  public updateAwayTeam(teamId: TeamId): void {
    if (this.props.homeTeamId?.equals(teamId)) {
      throw new BadRequestException(
        'Домашняя и гостевые команды не могут совпадать',
      );
    }

    this.props.awayTeamId = teamId;
    this.markAsUpdated();
  }

  public getMatchUrl(): string {
    return this.props.url;
  }

  public isHomeTeam(teamId: TeamId): boolean {
    return !!this.props.homeTeamId && this.props.homeTeamId.equals(teamId);
  }

  public isAwayTeam(teamId: TeamId): boolean {
    return !!this.props.awayTeamId && this.props.awayTeamId.equals(teamId);
  }

  public hasTeam(teamId: TeamId): boolean {
    return this.isHomeTeam(teamId) || this.isAwayTeam(teamId);
  }

  public getDeclaredPlayers(): PlayerId[] {
    return this.props.declaredPlayers || [];
  }

  public addDeclaredPlayer(playerId: PlayerId): void {
    if (!this.props.declaredPlayers) {
      this.props.declaredPlayers = [];
    }

    const isAlreadyDeclared = this.props.declaredPlayers.some((p) =>
      p.equals(playerId),
    );
    if (isAlreadyDeclared) {
      // Игнорируем уже заявленных игроков
      return;
    }

    this.props.declaredPlayers.push(playerId);
    this.markAsUpdated();
  }

  public removeDeclaredPlayer(playerId: PlayerId): void {
    if (!this.props.declaredPlayers) {
      return;
    }

    const index = this.props.declaredPlayers.findIndex((p) =>
      p.equals(playerId),
    );
    if (index === -1) {
      throw new BadRequestException('Игрок не найден в заявке на матч');
    }

    this.props.declaredPlayers.splice(index, 1);
    this.markAsUpdated();
  }

  public isPlayerDeclared(playerId: PlayerId): boolean {
    if (!this.props.declaredPlayers) {
      return false;
    }
    return this.props.declaredPlayers.some((p) => p.equals(playerId));
  }

  public getStartingLineups(): IStartingLineup[] {
    return this.props.startingLineups || [];
  }

  public getStartingLineupForSet(setNumber: number): IStartingLineup | null {
    if (!this.props.startingLineups) {
      return null;
    }
    return (
      this.props.startingLineups.find(
        (lineup) => lineup.setNumber === setNumber,
      ) || null
    );
  }

  public addStartingLineup(setNumber: number, playerIds: PlayerId[]): void {
    if (!this.props.startingLineups) {
      this.props.startingLineups = [];
    }

    // Проверяем, что все игроки заявлены на матч
    const undeclaredPlayers = playerIds.filter(
      (playerId) => !this.isPlayerDeclared(playerId),
    );
    if (undeclaredPlayers.length > 0) {
      // Логируем предупреждение вместо исключения
      this.logger.warn(
        `Незаявленные игроки в стартовом составе сета ${setNumber}: ${undeclaredPlayers.map((p) => p.value).join(', ')}`,
      );
      // Фильтруем только заявленных игроков
      playerIds = playerIds.filter((playerId) =>
        this.isPlayerDeclared(playerId),
      );
    }

    // Если нет заявленных игроков, игнорируем
    if (playerIds.length === 0) {
      this.logger.warn(
        `Нет заявленных игроков для стартового состава сета ${setNumber}`,
      );
      return;
    }

    // Удаляем существующий состав для этого сета (если есть)
    this.props.startingLineups = this.props.startingLineups.filter(
      (lineup) => lineup.setNumber !== setNumber,
    );

    // Добавляем новый состав
    this.props.startingLineups.push({
      setNumber,
      players: [...playerIds],
    });

    this.markAsUpdated();
  }

  public removeStartingLineup(setNumber: number): void {
    if (!this.props.startingLineups) {
      return;
    }

    const initialLength = this.props.startingLineups.length;
    this.props.startingLineups = this.props.startingLineups.filter(
      (lineup) => lineup.setNumber !== setNumber,
    );

    if (this.props.startingLineups.length < initialLength) {
      this.markAsUpdated();
    }
  }

  public clearAllStartingLineups(): void {
    if (this.props.startingLineups && this.props.startingLineups.length > 0) {
      this.props.startingLineups = [];
      this.markAsUpdated();
    }
  }

  public hasStartingLineupForSet(setNumber: number): boolean {
    return this.getStartingLineupForSet(setNumber) !== null;
  }

  public getPlayersInStartingLineup(setNumber: number): PlayerId[] {
    const lineup = this.getStartingLineupForSet(setNumber);
    return lineup ? lineup.players : [];
  }

  public isPlayerInStartingLineup(
    playerId: PlayerId,
    setNumber: number,
  ): boolean {
    const players = this.getPlayersInStartingLineup(setNumber);
    return players.some((p) => p.equals(playerId));
  }
}
