import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { Model } from 'mongoose';

@Injectable()
export class PlayerRepository {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // Создание нового игрока
  async create(playerData: {
    playerId: string;
    teamId: string;
    tournamentId: string;
  }) {
    const newPlayer = new this.playerModel(playerData);
    return newPlayer.save();
  }

  // Получение всех игроков
  async findAll() {
    return this.playerModel.find().exec();
  }

  // Поиск игрока по ID
  async findById(id: string) {
    return this.playerModel.findById(id).exec();
  }

  // Обновление игрока
  async update(
    id: string,
    updateData: { playerId?: string; teamId?: string; tournamentId?: string },
  ) {
    return this.playerModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  // Удаление игрока
  async delete(id: string) {
    return this.playerModel.findByIdAndDelete(id).exec();
  }
}
