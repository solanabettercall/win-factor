import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { SaveCompetitionCommand } from '../commands/save-competition.command';
import {
  Competition,
  ICompetition,
} from '../../domain/entities/competition.entity';
import { GetVolleystationCompetitionQuery } from 'src/modules/volleystation/application/queries/get-volleystation-competition.query';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { mapRawToCompetition } from '../mappers/competition.mapper';
import { GetVolleystationTeamsQuery } from 'src/modules/volleystation/application/queries/get-volleystation-teams.query';
import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { mapRawToTeam } from '../mappers/team.mapper';
import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { GetTeamQuery } from '../queries/get-team.query';
import { SaveTeamCommand } from '../commands/save-team.command';

@Injectable()
export class ScraperService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getCompetition(id: CompetitionId) {
    return this.queryBus.execute(new GetCompetitionQuery(id));
  }

  async saveCompetition(competition: ICompetition) {
    const creatingCompetition = Competition.create(competition);
    await this.commandBus.execute(
      new SaveCompetitionCommand(creatingCompetition),
    );
  }

  async getTeam(id: TeamId): Promise<Team | null> {
    return this.queryBus.execute(new GetTeamQuery(id));
  }

  async saveTeam(team: ITeam) {
    const creatingTeam = Team.create(team);
    await this.commandBus.execute(new SaveTeamCommand(creatingTeam));
  }

  private readonly logger = new Logger(this.constructor.name);

  async fetchAndSaveCompetition(id?: CompetitionId) {
    const competitionId = id ?? CompetitionId.create(110);

    const rawCompetition: IRawComptition | null = await this.queryBus.execute(
      new GetVolleystationCompetitionQuery(competitionId),
    );

    if (!rawCompetition) {
      this.logger.debug(`Турнир ${competitionId} не найден`);
      return;
    }

    const mappedCompetition: ICompetition = mapRawToCompetition(rawCompetition);

    await this.saveCompetition(mappedCompetition);

    const createdCompetition = await this.getCompetition(competitionId);
    console.log(createdCompetition);
  }

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(110);
    await this.fetchAndSaveCompetition(competitionId);

    await this.fetchAndSaveTeamsForCompetition(competitionId);

    const competition = await this.getCompetition(competitionId);
    console.log(competition?.getTeamCount());
  }

  async fetchAndSaveTeamsForCompetition(competitionId: CompetitionId) {
    const competition = await this.getCompetition(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const teams: IRawTeam[] = await this.queryBus.execute(
      new GetVolleystationTeamsQuery(competition),
    );

    // Map all teams
    const mappedTeams: ITeam[] = teams.map(mapRawToTeam);

    // Add teams to competition aggregate
    competition.addTeams(mappedTeams);

    // Save updated competition with teams
    await this.commandBus.execute(new SaveCompetitionCommand(competition));

    this.logger.log(
      `Добавлено ${competition.getTeamCount()} команд в турнир ${competition.getName()}`,
    );
  }
}
