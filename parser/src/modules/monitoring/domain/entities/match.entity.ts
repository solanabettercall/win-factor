import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { MatchId } from '../value-objects/match-id.vo';
import { MatchCreatedEvent } from '../events/match-created.event';
import { Team } from './team.entity';

export interface IMatchProps {
  id: MatchId;
  url: string;
}

interface IMatch extends IMatchProps {
  home: Team | null;
  away: Team | null;
}

export class Match extends BaseEntity<MatchId, IMatch> {
  private readonly logger = new Logger(this.constructor.name);

  private constructor(props: IMatchProps) {
    super(props.id, {
      ...props,
      home: null,
      away: null,
    });

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

  public getHomeTeam(): Readonly<Team | null> {
    return Object.freeze(this.props.home);
  }

  public getAwayTeam(): Readonly<Team | null> {
    return Object.freeze(this.props.away);
  }

  public updateHomeTeam(team: Team): void {
    if (this.props.away?.equals(team)) {
      throw new BadRequestException(
        'Домашняя и гостевые команды не могут совпадать',
      );
    }

    this.props.home = team;
    this.markAsUpdated();
  }

  public updateAwayTeam(team: Team): void {
    if (this.props.home?.equals(team)) {
      throw new BadRequestException(
        'Домашняя и гостевые команды не могут совпадать',
      );
    }

    this.props.away = team;
    this.markAsUpdated();
  }

  public getMatchUrl(): string {
    return this.props.url;
  }

  public isHomeTeam(team: Team): boolean {
    return !!this.props.home && this.props.home.equals(team);
  }

  public isAwayTeam(team: Team): boolean {
    return !!this.props.away && this.props.away.equals(team);
  }

  public hasTeam(team: Team): boolean {
    return this.isHomeTeam(team) || this.isAwayTeam(team);
  }
}
