import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { Logger } from '@nestjs/common';
import { MatchId } from '../value-objects/match-id.vo';
import { MatchCreatedEvent } from '../events/match-created.event';
import { Team } from './team.entity';

export interface IMatch {
  id: MatchId;
  matchUrl: string;
  home: Team | null;
  away: Team | null;
}

export class Match extends BaseEntity<MatchId, IMatch> {
  private readonly logger = new Logger(this.constructor.name);

  private constructor(props: IMatch) {
    super(props.id, props);
    const { away, home } = props;
    this.props.away = away;
    this.props.home = home;

    this.apply(new MatchCreatedEvent(props));
  }

  public static validate(props: IMatch) {
    if (props.home && props.away && props.home.equals(props.away)) {
      throw new Error('Home and away teams cannot be the same');
    }
    if (!props.matchUrl || props.matchUrl.trim() === '') {
      throw new Error('Match URL is required');
    }
  }

  public static create(props: IMatch) {
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
    this.logger.log(`Updating home team for match ${this.props.id}`);
    if (this.props.away?.equals(team)) {
      throw new Error('Home and away teams cannot be the same');
    }

    this.props.home = team;
    this.markAsUpdated();
  }

  public updateAwayTeam(team: Team): void {
    this.logger.log(`Updating away team for match ${this.props.id}`);
    if (this.props.home?.equals(team)) {
      throw new Error('Home and away teams cannot be the same');
    }

    this.props.away = team;
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
