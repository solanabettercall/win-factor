import { IPhaseInfo } from '../interfaces/phase-info.interface.ts';

export class PhaseInfo implements IPhaseInfo {
  id: number;
  name: string;

  constructor(data: IPhaseInfo) {
    Object.assign(this, data);
  }
}
