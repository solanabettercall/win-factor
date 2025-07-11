import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { Player } from '../../domain/entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { PlayerEntity } from '../../infrastructure/entities/player.entity';

export class PlayerMapper {
  static fromDomain(player: Player): PlayerMapper {
    return new PlayerMapper(player);
  }

  static fromEntity(entity: PlayerEntity): PlayerMapper {
    const player = Player.create({
      id: PlayerId.create(entity.id),
      name: entity.name,
      url: entity.url,
      photoUrl: entity.photoUrl,
      number: entity.number,
      position: entity.position,
    });

    return new PlayerMapper(player);
  }

  static fromRaw(raw: IRawPlayer): PlayerMapper {
    const player = Player.create(raw);

    return new PlayerMapper(player);
  }

  toDomain(): Player {
    return this.player;
  }

  toEntity(): PlayerEntity {
    const entity = new PlayerEntity();
    entity.id = this.player.getId().value;
    entity.name = this.player.getName();
    entity.url = this.player.getUrl();
    entity.photoUrl = this.player.getPhotoUrl();
    entity.number = this.player.getNumber();
    entity.position = this.player.getPosition();
    return entity;
  }

  toRaw(): IRawPlayer {
    return {
      id: this.player.getId(),
      name: this.player.getName(),
      url: this.player.getUrl(),
      photoUrl: this.player.getPhotoUrl(),
      number: this.player.getNumber(),
      position: this.player.getPosition(),
    };
  }

  private constructor(private readonly player: Player) {}
}
