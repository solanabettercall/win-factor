import { Module } from '@nestjs/common';
import { MonitoringRepository } from './monitoring.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitoring, MonitoringSchema } from './schemas/monitoring.schema';
import { MonitoringService } from './monitoring.service';

import { VolleystationModule } from 'src/parser/sites/volleystation/volleystation.module';
import { Competition, CompetitionSchema } from './schemas/competition.schema';
import { CompetitionService } from './competition.service';
import { CompetitionRepository } from './competition.repository';
import { Team, TeamSchema } from './schemas/team.schema';
import { TeamService } from './team.service';
import { TeamRepository } from './team.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monitoring.name, schema: MonitoringSchema },
      { name: Competition.name, schema: CompetitionSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    VolleystationModule,
  ],
  providers: [
    MonitoringService,
    CompetitionService,
    TeamService,
    MonitoringRepository,
    TeamRepository,
    CompetitionRepository,
  ],
  exports: [MonitoringService, CompetitionService, TeamService],
})
export class MonitoringModule {}
