import { Module } from '@nestjs/common';
import { PlayerRepository } from './player.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitoring, MonitoringSchema } from './schemas/monitoring.schema';
import { MonitoringService } from './monitoring.service';
import {
  CompetitionRepositoryToken,
  MonitoringRepositoryToken,
} from './repository-tokens';
import { VolleystationModule } from 'src/parser/sites/volleystation/volleystation.module';
import { Competition, CompetitionSchema } from './schemas/competition.schema';
import { CompetitionService } from './competition.service';
import { CompetitionRepository } from './competition.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monitoring.name, schema: MonitoringSchema },
      { name: Competition.name, schema: CompetitionSchema },
    ]),
    VolleystationModule,
  ],
  providers: [
    MonitoringService,
    CompetitionService,
    PlayerRepository,
    CompetitionRepository,
    {
      provide: MonitoringRepositoryToken,
      useExisting: PlayerRepository,
    },
    {
      provide: CompetitionRepositoryToken,
      useExisting: CompetitionRepository,
    },
  ],
  exports: [MonitoringService, CompetitionService],
})
export class MonitoringModule {}
