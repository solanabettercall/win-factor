import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { BadRequestException } from '@nestjs/common';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { Team, ITeam } from './team.entity';
import { TeamId } from '../value-objects/team-id.vo';

export interface ICompetition {
  id: CompetitionId;
  name: string;
  url: string;
  version: string;
}

export class Competition extends BaseEntity<CompetitionId, ICompetition> {
  private _teams: Team[] = [];
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
    this.validate(props);

    return new Competition(props);
  }

  public addTeam(teamProps: ITeam): void {
    const existingTeam = this._teams.find(
      (t) => t.getId().value === teamProps.id.value,
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
        // Log but continue with other teams
        console.warn(`Failed to add team ${teamProps.name}: ${error.message}`);
      }
    });
  }

  public removeTeam(teamId: TeamId): void {
    const teamIndex = this._teams.findIndex(
      (t) => t.getId().value === teamId.value,
    );
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
    return this._teams.some((t) => t.getId().value === teamId.value);
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
}
