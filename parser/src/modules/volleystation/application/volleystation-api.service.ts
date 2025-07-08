import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCompetitionApiService } from '../infrastructure/volleystation-competition.service';

@Injectable()
export class VolleystationApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly VolleystationCompetitionService: VolleystationCompetitionApiService,
  ) {}

  // async onApplicationBootstrap() {
  //   const competition =
  //     await this.VolleystationCompetitionService.getCompetition({
  //       id: 25,
  //       version: 'website',
  //     });
  //   console.log(competition);
  // }
}
