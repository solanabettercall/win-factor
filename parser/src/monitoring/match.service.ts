import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MatchRepository } from './match.repository';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';
import { Competition } from './schemas/competition.schema';
import { UpcomingMatcheDto } from './dtos/upcoming-match.dto';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  constructor(private readonly matchRepository: MatchRepository) {}

  saveMatch(competition: Competition, event: PlayByPlayEvent): Promise<void> {
    this.logger.debug('saveMatch');
    return this.matchRepository.upsert(competition, event);
  }

  getMatchById(id: string): Observable<PlayByPlayEvent> {
    return this.matchRepository.get(id);
  }

  getUpcomingMatches(): Observable<UpcomingMatcheDto[]> {
    this.logger.debug('getUpcomingMatches');
    return this.matchRepository.getToday();
  }
}
