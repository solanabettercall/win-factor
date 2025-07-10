import { Command } from '@nestjs/cqrs';
import { IMatchProps } from '../../domain/entities/match.entity';

export class SaveMatchCommand extends Command<void> {
  constructor(public readonly props: IMatchProps) {
    super();
  }
}
