import { Module } from '@nestjs/common';
import { MonitoringRepository } from './monitoring.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitoring, MonitoringSchema } from './schemas/monitoring.schema';
import { MonitoringService } from './monitoring.service';
import { VolleystationModule } from 'src/parser/sites/volleystation/volleystation.module';
import { Competition, CompetitionSchema } from './schemas/competition.schema';
import { CompetitionService } from './competition.service';
import { CompetitionRepository } from './competition.repository';
import { MatchService } from './match.service';
import { MatchModel, MatchSchema } from './schemas/match.schema';
import { MatchRepository } from './match.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monitoring.name, schema: MonitoringSchema },
      { name: Competition.name, schema: CompetitionSchema },
      { name: MatchModel.name, schema: MatchSchema },
    ]),
    VolleystationModule,
  ],
  providers: [
    MonitoringService,
    MatchService,
    CompetitionService,
    MatchRepository,
    MonitoringRepository,
    CompetitionRepository,
  ],
  exports: [MonitoringService, CompetitionService, MatchService],
})
export class MonitoringModule {}
