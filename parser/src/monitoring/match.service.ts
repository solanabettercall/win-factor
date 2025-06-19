import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MatchRepository } from './match.repository';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  constructor(private readonly matchRepository: MatchRepository) {}

  saveMatch(event: PlayByPlayEvent): Promise<void> {
    this.logger.debug('saveMatch');
    return this.matchRepository.upsert(event);
  }

  getMatchById(id: string): Observable<PlayByPlayEvent> {
    return this.matchRepository.get(id);
  }
}
