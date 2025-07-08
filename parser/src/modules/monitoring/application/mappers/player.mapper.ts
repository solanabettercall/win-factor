import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { IPlayer } from '../../domain/entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';

export function mapRawToPlayer(raw: IRawPlayer): IPlayer {
  return {
    id: PlayerId.create(raw.id),
    name: raw.name,
    url: raw.url,
    number: raw.number,
    photoUrl: raw.photoUrl,
    position: raw.position,
  };
}
