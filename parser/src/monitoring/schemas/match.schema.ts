import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IPlayByPlayEvent } from 'src/parser/sites/volleystation/interfaces/match-details/play-by-play-event.interface';

export type MatchDocument = MatchModel & Document;

@Schema({ timestamps: true })
export class MatchModel implements Omit<IPlayByPlayEvent, 'id'> {
  @Prop({ required: true })
  matchId: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: Object })
  teams: any;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  hall: string;

  @Prop()
  phase: string;

  @Prop()
  round: string;

  @Prop()
  competition: string;

  @Prop()
  remarks: string;

  @Prop()
  matchNumber: string;

  @Prop()
  division: string;

  @Prop()
  category: string;

  @Prop({ type: Object })
  officials: any;

  @Prop({ type: Object })
  scout: any;

  @Prop({ type: Object })
  settings: any;

  @Prop()
  version: number;

  @Prop({ type: Object })
  workTeam: any;

  @Prop({ type: [[Object]] })
  scoutData: any[][];
}

export const MatchSchema = SchemaFactory.createForClass(MatchModel);
