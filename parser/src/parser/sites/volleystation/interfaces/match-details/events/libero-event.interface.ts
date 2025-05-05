export interface ILiberoEvent {
  team: 'home' | 'away';
  enters: boolean;
  time: string;
  libero: number;
  player: number;
}
