import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IPlayer } from 'src/parser/sites/volleystation/interfaces/team-roster/player.interface';
import { Competition, CompetitionDocument } from './competition.schema';

export type PlayerDocument = Player & Document;

@Schema()
export class Player implements IPlayer {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  url: string;

  @Prop({ required: false })
  photoUrl: string | undefined;

  @Prop({ type: 'ObjectId', ref: Competition.name, required: true })
  competition: CompetitionDocument | Types.ObjectId;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
