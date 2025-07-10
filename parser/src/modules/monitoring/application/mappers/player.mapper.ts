import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { IPlayer, Player } from '../../domain/entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { PlayerEntity } from '../../infrastructure/entities/player.entity';

export class PlayerMapper {
  static rawToDomain(raw: IRawPlayer): IPlayer {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      photoUrl: raw.photoUrl,
      number: raw.number,
      position: raw.position,
    };
  }

  static domainToEntity(player: Player): PlayerEntity {
    const entity = new PlayerEntity();
    entity.id = player.getId().value;
    entity.name = player.getName();
    entity.url = player.getUrl();
    entity.photoUrl = player.getPhotoUrl();
    entity.number = player.getNumber();
    entity.position = player.getPosition();
    return entity;
  }

  static entityToDomain(entity: PlayerEntity): IPlayer {
    return {
      id: PlayerId.create(entity.id),
      name: entity.name,
      url: entity.url,
      photoUrl: entity.photoUrl,
      number: entity.number,
      position: entity.position,
    };
  }
}
