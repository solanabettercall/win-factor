import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { Logger } from '@nestjs/common';
import { MatchId } from '../value-objects/match-id.vo';
import { MatchCreatedEvent } from '../events/match-created.event';
import { ITeam, Team } from './team.entity';

export interface IMatchProps {
  id: MatchId;
  matchUrl: string;
}

export interface IMatch extends IMatchProps {
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
    if (!props.matchUrl || props.matchUrl.trim() === '') {
      throw new Error('Match URL is required');
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

  public updateHomeTeam(team: ITeam): void {
    const _team = Team.create(team);
    this.logger.log(`Updating home team for match ${this.props.id}`);
    if (this.props.away?.equals(_team)) {
      throw new Error('Home and away teams cannot be the same');
    }

    (this.props as any).home = _team;
    this.markAsUpdated();
  }

  public updateAwayTeam(team: ITeam): void {
    const _team = Team.create(team);
    this.logger.log(`Updating away team for match ${this.props.id}`);
    if (this.props.home?.equals(_team)) {
      throw new Error('Home and away teams cannot be the same');
    }

    (this.props as any).away = _team;
    this.markAsUpdated();
  }

  public getMatchUrl(): string {
    return this.props.matchUrl;
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
