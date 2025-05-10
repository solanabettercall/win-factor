import { Module } from '@nestjs/common';
import { PlayerRepository } from './player.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from './schemas/player.schema';
import { PlayerService } from './player.service';
import { PlayerRepositoryToken } from './player-repository.token';
import { VolleystationModule } from 'src/parser/sites/volleystation/volleystation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
    VolleystationModule,
  ],
  providers: [
    PlayerService,
    PlayerRepository,
    {
      provide: PlayerRepositoryToken,
      useExisting: PlayerRepository,
    },
  ],
  exports: [],
})
export class MonitoringModule {}
