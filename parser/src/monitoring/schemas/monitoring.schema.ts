import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitoringDocument = Monitoring & Document;

@Schema()
export class Monitoring {
  @Prop({ required: true })
  playerId: number;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  competitionId: number;
}

export const MonitoringSchema = SchemaFactory.createForClass(Monitoring);

MonitoringSchema.index(
  { playerId: 1, teamId: 1, competitionId: 1 },
  { unique: true },
);
