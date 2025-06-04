import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Competition, CompetitionDocument } from './competition.schema';
import { Team, TeamDocument } from './team.schema';
import { Player, PlayerDocument } from './player.schema';

@Schema()
export class Monitoring {
  // @Prop({ required: true })
  // playerId: number;

  @Prop({ type: 'ObjectId', ref: Player.name, required: true })
  player: PlayerDocument | Types.ObjectId;

  @Prop({ type: 'ObjectId', ref: Team.name, required: true })
  team: TeamDocument | Types.ObjectId;

  @Prop({ type: 'ObjectId', ref: Competition.name, required: true })
  competition: CompetitionDocument | Types.ObjectId;
}

export type MonitoringDocument = Monitoring & Document;
export const MonitoringSchema = SchemaFactory.createForClass(Monitoring);

MonitoringSchema.index(
  { player: 1, team: 1, competition: 1 },
  { unique: true },
);
