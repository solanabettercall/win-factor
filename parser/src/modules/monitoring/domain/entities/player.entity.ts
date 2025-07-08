import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { PlayerId } from '../value-objects/player-id.vo';
import { PlayerCreatedEvent } from '../events/player-created.event';

export interface IPlayer {
  id: PlayerId;
  name: string;
  url: string;
  photoUrl: string | null;
  number: number;
  position: string;
}

export class Player extends BaseEntity<PlayerId, IPlayer> {
  private constructor(props: IPlayer) {
    super(props.id, props);
    this.apply(new PlayerCreatedEvent(props));
  }

  public static validate(props: IPlayer) {
    if (props.name.length < 1) {
      throw new BadRequestException(`Имя игрока не должено быть пустым`);
    }
  }

  public static create(props: IPlayer): Player {
    this.validate(props);

    return new Player(props);
  }

  public getName(): string {
    return this.props.name;
  }

  public getId(): PlayerId {
    return this.props.id;
  }
}
