import { Injectable } from '@nestjs/common';
import { IPlayerRepository } from '../../domain/repositories/player.repository.interface';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Player } from '../../domain/entities/player.entity';

@Injectable()
export class ImMemoryPlayerRepository implements IPlayerRepository {
  private storage: Map<PlayerId, Player> = new Map<PlayerId, Player>();

  findById(id: PlayerId): Promise<Player | null> {
    return Promise.resolve(this.storage.get(id) ?? null);
  }

  save(player: Player): Promise<void> {
    this.storage.set(player.id, player);
    return Promise.resolve();
  }
}
