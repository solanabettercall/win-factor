import { ISeasonInfo } from '../interfaces/season-info.interface.ts';

export class SeasonInfo implements ISeasonInfo {
  id: string;

  constructor(data: ISeasonInfo) {
    Object.assign(this, data);
  }
}
