import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompetitionDocument = Competition & Document;

@Schema()
export class Competition {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;
}

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
