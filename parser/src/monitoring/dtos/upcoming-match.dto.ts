import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';
import { Competition } from '../schemas/competition.schema';

export class UpcomingMatcheDto {
  event: PlayByPlayEvent;
  competition: Competition;
}
