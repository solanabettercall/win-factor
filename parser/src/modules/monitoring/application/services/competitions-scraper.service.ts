import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { CreateCompetitionCommand } from '../commands/create-competition.command';
import {
  Competition,
  ICompetition,
} from '../../domain/entities/competition.entity';

@Injectable()
export class CompetitionsScraperService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getCompetition(id: CompetitionId) {
    return this.queryBus.execute(new GetCompetitionQuery(id));
  }

  async createCompetition(competition: ICompetition) {
    const creatingCompetition = Competition.create(competition);
    await this.commandBus.execute(
      new CreateCompetitionCommand(creatingCompetition),
    );
  }

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(25);

    const dto: ICompetition = {
      id: competitionId,
      name: 'Test',
      url: 'http://example.com',
      version: 'website',
    };

    await this.createCompetition(dto);

    const createdCompetition = await this.getCompetition(competitionId);
    console.log(createdCompetition);
  }
}
