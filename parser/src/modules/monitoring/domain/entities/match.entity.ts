import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { MatchId } from '../value-objects/match-id.vo';
import { MatchCreatedEvent } from '../events/match-created.event';
import { TeamId } from '../value-objects/team-id.vo';
import { CompetitionId } from '../value-objects/competition-id.vo';

export interface IMatchProps {
  id: MatchId;
  url: string;
  competitionId: CompetitionId;
  homeTeamId?: TeamId;
  awayTeamId?: TeamId;
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
}
