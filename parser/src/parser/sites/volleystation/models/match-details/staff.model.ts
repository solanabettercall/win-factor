import { Type } from 'class-transformer';
import { IStaff } from '../../interfaces/match-details/staff.interface';
import { Person } from './person.model';

export class Staff implements IStaff {
  type: string;
  @Type(() => Person)
  person: Person;
}
