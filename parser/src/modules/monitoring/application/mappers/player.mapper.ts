import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { IPlayer, Player } from '../../domain/entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { PlayerEntity } from '../../infrastructure/entities/player.entity';

export class PlayerMapper {
  static fromDomain(player: Player): PlayerMapper {
    return new PlayerMapper(player, null, null);
  }

  static fromEntity(entity: PlayerEntity): PlayerMapper {
    return new PlayerMapper(null, entity, null);
  }

  static fromRaw(raw: IRawPlayer): PlayerMapper {
    return new PlayerMapper(null, null, raw);
  }

  toDomain(): Player {
    if (this.player) {
      return this.player;
    }

    if (this.entity) {
      return PlayerMapper.entityToDomain(this.entity);
    }

    if (this.raw) {
      const domainProps = PlayerMapper.rawToDomain(this.raw);
      return Player.create(domainProps);
    }

    throw new Error('No data available to convert to domain');
  }

  toEntity(): PlayerEntity {
    if (this.entity) {
      return this.entity;
    }

    if (this.player) {
      return PlayerMapper.domainToEntity(this.player);
    }

    if (this.raw) {
      const domain = this.toDomain();
      return PlayerMapper.domainToEntity(domain);
    }

    throw new Error('No data available to convert to entity');
  }

  toRaw(): IRawPlayer {
    if (this.raw) {
      return this.raw;
    }

    if (this.player) {
      return {
        id: this.player.getId(),
        name: this.player.getName(),
        url: this.player.getUrl(),
        photoUrl: this.player.getPhotoUrl(),
        number: this.player.getNumber(),
        position: this.player.getPosition(),
      };
    }

    if (this.entity) {
      return {
        id: PlayerId.create(this.entity.id),
        name: this.entity.name,
        url: this.entity.url,
        photoUrl: this.entity.photoUrl,
        number: this.entity.number,
        position: this.entity.position,
      };
    }

    throw new Error('No data available to convert to raw');
  }

  private static rawToDomain(raw: IRawPlayer): IPlayer {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      photoUrl: raw.photoUrl,
      number: raw.number,
      position: raw.position,
    };
  }

  private static domainToEntity(player: Player): PlayerEntity {
    const entity = new PlayerEntity();
    entity.id = player.getId().value;
    entity.name = player.getName();
    entity.url = player.getUrl();
    entity.photoUrl = player.getPhotoUrl();
    entity.number = player.getNumber();
    entity.position = player.getPosition();
    return entity;
  }

  private static entityToDomain(entity: PlayerEntity): Player {
    const player = Player.create({
      id: PlayerId.create(entity.id),
      name: entity.name,
      url: entity.url,
      photoUrl: entity.photoUrl,
      number: entity.number,
      position: entity.position,
    });

    return player;
  }

  private constructor(
    private readonly player: Player | null,
    private readonly entity: PlayerEntity | null,
    private readonly raw: IRawPlayer | null,
  ) {}
}
