import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { ITeam } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';

export function mapRawToTeam(raw: IRawTeam): ITeam {
  return {
    id: TeamId.create(raw.id),
    name: raw.name,
    url: raw.url,
  };
}
