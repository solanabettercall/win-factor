import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ITeam } from 'src/parser/sites/volleystation/interfaces/team-list/team.interface';

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
}

export const TeamSchema = SchemaFactory.createForClass(Team);
