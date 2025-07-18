import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IMatchStartingLineupRepository,
  ITeamStartingLineup,
} from '../../domain/repositories/match-starting-lineup.repository.interface';
import { MatchStartingLineupEntity } from '../entities/match-starting-lineup.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';

@Injectable()
export class PostgresMatchStartingLineupRepository
  implements IMatchStartingLineupRepository
{
  constructor(
    @InjectRepository(MatchStartingLineupEntity)
    private readonly repository: Repository<MatchStartingLineupEntity>,
  ) {}

  async saveStartingLineup(
    matchId: MatchId,
    setNumber: number,
    playerIds: PlayerId[],
  ): Promise<void> {
    await this.clearStartingLineup(matchId, setNumber);

    const entities = playerIds.map((playerId) => ({
      match: { id: matchId.value },
      player: { id: playerId.value },
      setNumber,
    }));

    await this.repository.save(entities);
  }

  async getStartingLineupForSet(
    matchId: MatchId,
    setNumber: number,
  ): Promise<ITeamStartingLineup> {
    const lineups = await this.repository.find({
      where: {
        match: { id: matchId.value },
        setNumber,
      },
      relations: [
        'player',
        'player.team',
        'match',
        'match.homeTeam',
        'match.awayTeam',
      ],
    });

    const homeTeam: PlayerId[] = [];
    const awayTeam: PlayerId[] = [];

    lineups.forEach((lineup) => {
      const playerId = PlayerId.create(lineup.player.id);
      const playerTeam = lineup.player.team;
      const match = lineup.match;

      const isHomeTeam =
        match.homeTeam &&
        playerTeam &&
        playerTeam.numeric === match.homeTeam.numeric &&
        playerTeam.code === match.homeTeam.code;

      if (isHomeTeam) {
        homeTeam.push(playerId);
      } else {
        awayTeam.push(playerId);
      }
    });

    return { homeTeam, awayTeam };
  }

  async clearStartingLineup(
    matchId: MatchId,
    setNumber: number,
  ): Promise<void> {
    await this.repository.delete({
      match: { id: matchId.value },
      setNumber,
    });
  }
}
