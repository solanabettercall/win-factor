import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as io from 'socket.io-client';
import { Expose, plainToInstance, Type } from 'class-transformer';

interface IPerson {
  firstName: string;
  lastName: string;
}

class Person implements IPerson {
  firstName: string;
  lastName: string;
}

interface IStaff {
  type: string;
  person: IPerson;
}
class Staff implements IStaff {
  type: string;
  @Type(() => Person)
  person: Person;
}

interface IPlayer {
  code: number;
  firstName: string;
  lastName: string;
  isForeign: boolean;
  isDisabled: boolean;
  isConfederation: boolean;
  shirtNumber: number;
}

class Player implements IPlayer {
  code: number;
  firstName: string;
  lastName: string;
  isForeign: boolean;
  isDisabled: boolean;
  isConfederation: boolean;
  shirtNumber: number;
}

interface ITeam {
  code: string;
  name: string;
  shortName: string;
  staff: IStaff[];
  captain: number;
  libero: number[];
  players: IPlayer[];
  reserve: IPlayer[];
  color: string;
  email: string;
}

interface IOfficial {
  firstName: string;
  lastName: string;
  level: string | null;
}

interface ICoinToss {
  start: ICoinTossStart;
}

interface ICoinTossStart {
  start: string;
  leftSide: string;
  winner: string;
}

class CoinTossStart implements ICoinTossStart {
  start: string;
  leftSide: string;
  winner: string;
}
class CoinToss implements ICoinToss {
  @Type(() => CoinTossStart)
  start: CoinTossStart;
}

interface IScore {
  home: number;
  away: number;
}

class Score implements IScore {
  home: number;
  away: number;
}

interface IStartingLineup {
  home: number[];
  away: number[];
}

class StartingLineup implements IStartingLineup {
  home: number[];
  away: number[];
}

interface ILiberoEvent {
  team: 'home' | 'away';
  enters: boolean;
  time: string;
  libero: number;
  player: number;
}

class LiberoEvent implements ILiberoEvent {
  team: 'home' | 'away';
  enters: boolean;
  time: string;
  libero: number;
  player: number;
}

interface IRallyEvent {
  point: 'home' | 'away' | null;
  startTime: Date;
  endTime: Date | null;
}

class RallyEvent implements IRallyEvent {
  point: 'home' | 'away';
  @Type(() => Date)
  startTime: Date;
  @Type(() => Date)
  endTime: Date;
}

interface ITimeoutEvent {
  team: 'home' | 'away';
  time: Date;
}

class TimeoutEvent implements ITimeoutEvent {
  team: 'home' | 'away';
  @Type(() => Date)
  time: Date;
}

interface ISubstitutionEvent {
  team: 'home' | 'away';
  time: Date;
  in: number;
  out: number;
}

class SubstitutionEvent implements ISubstitutionEvent {
  team: 'home' | 'away';
  @Type(() => Date)
  time: Date;
  in: number;
  out: number;
}

interface IEvent {
  libero: ILiberoEvent | null;
  rally: IRallyEvent | null;
  timeout: ITimeoutEvent | null;
  substitution: ISubstitutionEvent | null;
}

class Event implements IEvent {
  @Type(() => LiberoEvent)
  libero: LiberoEvent | null;
  @Type(() => RallyEvent)
  rally: RallyEvent | null;
  @Type(() => TimeoutEvent)
  timeout: TimeoutEvent | null;
  @Type(() => SubstitutionEvent)
  substitution: SubstitutionEvent | null;
}

interface ISet {
  startTime: Date | null;
  endTime: Date | null;
  score: IScore;
  duration: number;
  startingLineup: IStartingLineup;
  events: IEvent[];
}

class Set implements ISet {
  @Type(() => Date)
  startTime: Date | null;
  @Type(() => Date)
  endTime: Date | null;
  @Type(() => Score)
  score: Score;
  duration: number;
  @Type(() => StartingLineup)
  startingLineup: StartingLineup;
  @Type(() => Event)
  events: Event[];
}

interface IShortPlayer {
  number: number;
  team: 'home' | 'away';
}

class ShortPlayer implements IShortPlayer {
  number: number;
  team: 'home' | 'away';
}

interface IScout {
  sets: ISet[];
  interruptions: unknown[];
  objections: unknown[];
  coinToss: CoinToss;
  bestPlayer: ShortPlayer | null;
  ended: Date | null;
  mvp: ShortPlayer | null;
}

interface ISettings {
  winningScore: number;
  regularSetWin: number;
  decidingSetWin: number;
  goldenSetWin: number;
  maxForeign: number;
  maxConfederation: number;
  maxSubstitution: number;
  maxVideoChallenge: number;
  maxTimeout: number;
  timeoutLength: number[];
  technicalTimeouts: unknown[];
  decidingTechnicalTimeouts: unknown[];
  technicalTimeoutLength: unknown[];
  squadSizeForSecondLibero: number;
  playersOnRoster: number;
  rotationZones: number[];
  libero: boolean;
  technicalTimeoutScoreSum: boolean;
  coinTossEachSet: boolean;
  maxPenalty: number;
  sanctionsPerSet: boolean;
  medicalAssistance: boolean;
  fixedRotations: boolean;
  variation: string;
  challengeOptions: string;
  fixedSets: boolean;
  noVideoChallengeRefunds: boolean;
  setBreaks: number[];
  trackCaptain: boolean;
  digitalSignatures: boolean;
  liberoCanServe: boolean;
  multiplePositionSubs: boolean;
  liberoPerSet: boolean;
  simpleStats: boolean;
  goldenSet: boolean;
  rosterApprovals: string[];
  resultApprovals: string[];
  remarksApprovals: string[];
  vis: boolean;
  midRallyChallenge: boolean;
  timeoutResets: unknown[];
  regularSetSideChanges: number[];
  decidingSetSideDecision: boolean;
  decidingSetSideChange: boolean;
  organiserName: unknown;
  videoChallengePerMatch: boolean;
  paraVolley: boolean;
  nonDisabledOnRoster: number;
  nonDisabledInLineup: number;
  codeOnReports: boolean;
  mediaTimeout: boolean;
  serveTimer: unknown | null;
  superPointInSet: unknown | null;
  superPointInSetDeciding: unknown | null;
}
interface IPlay {
  team: 'home' | 'away';
  player: number;
  skill: string;
  effect: string;
}

class Play implements IPlay {
  team: 'home' | 'away';
  player: number;
  skill: string;
  effect: string;
}

interface IScoutData {
  point: string;
  score: IScore;
  plays: IPlay[];
}

interface IPlayByPlayEvent {
  id: string;
  /**
   * UTC-0
   */
  startDate: Date;
  teams: {
    home: ITeam;
    away: ITeam;
  };
  city: string;
  country: string;
  hall: string;
  phase: string;
  round: number;
  competition: string;
  remarks: string;
  matchNumber: string;
  division: string;
  category: string;
  officials: {
    supervisor: IOfficial | null;
    referee1: IOfficial | null;
    referee2: IOfficial | null;
    scorer1: IOfficial | null;
    lineJudge1: IOfficial | null;
    lineJudge2: IOfficial | null;
  };
  scout: IScout;
  settings: ISettings;
  version: number;
  workTeam: unknown;
  matchId: number;
  scoutData: ScoutData[][];
}

class Team implements ITeam {
  code: string;
  name: string;
  shortName: string;
  @Type(() => Staff)
  staff: Staff[];
  captain: number;
  libero: number[];
  @Type(() => Player)
  players: Player[];
  @Type(() => Player)
  reserve: Player[];
  color: string;
  email: string;
}

class Official implements IOfficial {
  firstName: string;
  lastName: string;
  level: string | null;
}

class Scout implements IScout {
  @Type(() => ShortPlayer)
  bestPlayer: ShortPlayer | null;
  @Type(() => Date)
  ended: Date | null;
  @Type(() => ShortPlayer)
  mvp: ShortPlayer | null;
  @Type(() => CoinToss)
  coinToss: CoinToss;
  @Type(() => Set)
  sets: Set[];
  interruptions: unknown[];
  objections: unknown[];
}

class Settings implements ISettings {
  serveTimer: unknown;
  superPointInSet: unknown;
  superPointInSetDeciding: unknown;
  winningScore: number;
  regularSetWin: number;
  decidingSetWin: number;
  goldenSetWin: number;
  maxForeign: number;
  maxConfederation: number;
  maxSubstitution: number;
  maxVideoChallenge: number;
  maxTimeout: number;
  timeoutLength: number[];
  technicalTimeouts: unknown[];
  decidingTechnicalTimeouts: unknown[];
  technicalTimeoutLength: unknown[];
  squadSizeForSecondLibero: number;
  playersOnRoster: number;
  rotationZones: number[];
  libero: boolean;
  technicalTimeoutScoreSum: boolean;
  coinTossEachSet: boolean;
  maxPenalty: number;
  sanctionsPerSet: boolean;
  medicalAssistance: boolean;
  fixedRotations: boolean;
  variation: string;
  challengeOptions: string;
  fixedSets: boolean;
  noVideoChallengeRefunds: boolean;
  setBreaks: number[];
  trackCaptain: boolean;
  digitalSignatures: boolean;
  liberoCanServe: boolean;
  multiplePositionSubs: boolean;
  liberoPerSet: boolean;
  simpleStats: boolean;
  goldenSet: boolean;
  rosterApprovals: string[];
  resultApprovals: string[];
  remarksApprovals: string[];
  vis: boolean;
  midRallyChallenge: boolean;
  timeoutResets: unknown[];
  regularSetSideChanges: number[];
  decidingSetSideDecision: boolean;
  decidingSetSideChange: boolean;
  organiserName: string;
  videoChallengePerMatch: boolean;
  paraVolley: boolean;
  nonDisabledOnRoster: number;
  nonDisabledInLineup: number;
  codeOnReports: boolean;
  mediaTimeout: boolean;
}

class ScoutData implements IScoutData {
  point: string;
  @Type(() => Score)
  score: Score;
  @Type(() => Play)
  plays: Play[];
}

class Teams {
  @Type(() => Team)
  home: Team;

  @Type(() => Team)
  away: Team;
}

class Officials {
  @Type(() => Official)
  referee1: Official | null;
  @Type(() => Official)
  @Type(() => Official)
  referee2: Official | null;
  @Type(() => Official)
  scorer1: Official | null;

  @Type(() => Official)
  scorer2: Official | null;
  @Type(() => Official)
  lineJudge1: Official | null;
  @Type(() => Official)
  lineJudge2: Official | null;
  @Type(() => Official)
  supervisor: Official | null;
}

export class PlayByPlayEvent implements IPlayByPlayEvent {
  @Expose({ name: '_id' })
  id: string;
  @Type(() => Date)
  startDate: Date;
  @Type(() => Teams)
  teams: Teams;
  city: string;
  country: string;
  hall: string;
  phase: string;
  round: number;
  competition: string;
  remarks: string;
  matchNumber: string;
  division: string;
  category: string;
  @Type(() => Officials)
  officials: Officials;
  @Type(() => Scout)
  scout: Scout;
  @Type(() => Settings)
  settings: Settings;
  version: number;
  workTeam: unknown;
  matchId: number;

  @Type(() => ScoutData)
  scoutData: ScoutData[][];
}

@Injectable()
export class VolleystationSocketService implements OnModuleInit {
  private readonly logger = new Logger(VolleystationSocketService.name);
  private socket: io.Socket | null = null;

  async onModuleInit() {
    this.socket = io('wss://api.widgets.volleystation.com', {
      path: '/socket.io/',
      transports: ['websocket'],
      query: {
        token: 'PhodQuahof1ShmunWoifdedgasvuipki',
      },
      extraHeaders: {
        Origin: 'https://widgets.volleystation.com',
        Referer: 'https://widgets.volleystation.com',
      },
    });

    this.socket.once('connect', () => {
      this.logger.log('Socket подключён.');
    });

    this.socket.once('connect_error', (err) => {
      this.logger.error(`Ошибка подключения: ${err.message}`);
    });

    this.socket.once('disconnect', (reason) => {
      this.logger.warn(`Socket отключён: ${reason}`);
    });
  }

  public async getMatchInfo(matchId: number): Promise<PlayByPlayEvent | null> {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        'find',
        'widget/play-by-play',
        {
          matchId,
          $limit: 1,
        },
        (err: Error, response: { data: PlayByPlayEvent[] }) => {
          if (err) {
            this.logger.warn(`Ошибка от сервера: ${err.message}`);
            return reject(err);
          }

          const event = response.data?.[0] ?? null;

          resolve(event ? plainToInstance(PlayByPlayEvent, event) : null);
        },
      );
    });
  }
}
