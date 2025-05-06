import { Module } from '@nestjs/common';
import { PlayerRepository } from './player.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from './schemas/player.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
  ],
  providers: [PlayerRepository],
  exports: [],
})
export class MonitoringModule {}
