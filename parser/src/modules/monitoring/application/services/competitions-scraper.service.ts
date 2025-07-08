import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { CreateCompetitionCommand } from '../commands/create-competition.command';
import {
  Competition,
  ICompetition,
} from '../../domain/entities/competition.entity';
import { GetVolleystationCompetitionQuery } from 'src/modules/volleystation/application/queries/get-volleystation-competition.query';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { mapRawToCompetition } from '../mappers/competition.mapper';

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

  private readonly logger = new Logger(this.constructor.name);

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(110);

    const rawCompetition: IRawComptition | null = await this.queryBus.execute(
      new GetVolleystationCompetitionQuery(competitionId),
    );

    if (!rawCompetition) {
      this.logger.debug(`Турнир ${competitionId} не найден`);
      return;
    }

    const mappedCompetition: ICompetition = mapRawToCompetition(rawCompetition);
    // const dto: ICompetition = {
    //   id: competitionId,
    //   name: 'Test',
    //   url: 'http://example.com',
    //   version: 'website',
    // };

    await this.createCompetition(mappedCompetition);

    const createdCompetition = await this.getCompetition(competitionId);
    console.log(createdCompetition);
  }
}
