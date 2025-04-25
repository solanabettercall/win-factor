import { IStadiumInfo } from '../interfaces/stadium-info.interface.ts';

export class StadiumInfo implements IStadiumInfo {
  name: string;
  city: string;
  country: string;

  constructor(data: IStadiumInfo) {
    Object.assign(this, data);
  }
}
