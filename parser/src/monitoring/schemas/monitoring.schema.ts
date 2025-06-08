import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Competition, CompetitionDocument } from './competition.schema';

@Schema()
export class Monitoring {
  @Prop({ required: true })
  playerId: number;

  @Prop({ required: true })
  teamId: string;

  @Prop({ type: 'ObjectId', ref: Competition.name, required: true })
  competition: CompetitionDocument | Types.ObjectId;
}

export type MonitoringDocument = Monitoring & Document;
export const MonitoringSchema = SchemaFactory.createForClass(Monitoring);

MonitoringSchema.index(
  { playerId: 1, teamId: 1, competition: 1 },
  { unique: true },
);
