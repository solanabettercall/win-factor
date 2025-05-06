import { Injectable } from '@nestjs/common';
import { PlayerRepository } from './player.repository';

@Injectable()
export class PlayerService {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async create(playerData: {
    playerId: string;
    teamId: string;
    tournamentId: string;
  }) {
    return this.playerRepository.create(playerData);
  }

  async findAll() {
    return this.playerRepository.findAll();
  }

  async findById(id: string) {
    return this.playerRepository.findById(id);
  }

  async update(
    id: string,
    updateData: { playerId?: string; teamId?: string; tournamentId?: string },
  ) {
    return this.playerRepository.update(id, updateData);
  }

  async delete(id: string) {
    return this.playerRepository.delete(id);
  }
}
