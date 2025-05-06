import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

@Schema()
export class Player {
  @Prop({ required: true })
  playerId: number;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  tournamentId: number;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
