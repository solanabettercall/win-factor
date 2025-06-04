import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ITeam } from 'src/parser/sites/volleystation/interfaces/team-list/team.interface';
import { Competition, CompetitionDocument } from './competition.schema';

export type TeamDocument = Team & Document;

@Schema()
export class Team implements ITeam {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: false })
  logoUrl: string;

  @Prop({ type: 'ObjectId', ref: Competition.name, required: true })
  competition: CompetitionDocument | Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
