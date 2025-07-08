import { ICompetition } from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';

export function mapRawToCompetition(raw: IRawComptition): ICompetition {
  return {
    id: CompetitionId.create(raw.id),
    name: raw.name,
    url: raw.url,
    version: 'website',
  };
}
