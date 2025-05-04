export interface IRallyEvent {
  point: 'home' | 'away' | null;
  startTime: Date;
  endTime: Date | null;
}
