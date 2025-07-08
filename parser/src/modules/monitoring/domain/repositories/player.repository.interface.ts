import { Player } from '../entities/player.entity';
import { PlayerId } from '../value-objects/player-id.vo';

export const PLAYER_REPOSITORY = 'IPlayerRepository';

export interface IPlayerRepository {
  findById(id: PlayerId): Promise<Player | null>;
  save(competition: Player): Promise<void>;
}
