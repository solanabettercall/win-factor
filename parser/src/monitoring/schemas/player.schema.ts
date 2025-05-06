import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

@Schema()
export class Player {
  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  tournamentId: string;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
