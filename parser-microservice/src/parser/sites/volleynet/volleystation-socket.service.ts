import { Injectable, Logger } from '@nestjs/common';
import * as io from 'socket.io-client';

interface IPerson {
  firstName: string;
  lastName: string;
}

class Person implements IPerson {
  constructor(dto: IPerson) {
    Object.assign(this, dto);
  }
  firstName: string;
  lastName: string;
}

interface IStaff {
  type: string;
  person: IPerson;
}
class Staff implements IStaff {
  constructor(dto: IStaff) {
    if (dto.person) dto.person = new Person(dto.person);
    Object.assign(this, dto);
  }
  type: string;
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
  constructor(dto: IPlayer) {
    Object.assign(this, dto);
  }
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
  start: {
    start: string;
    leftSide: string;
    winner: string;
  };
}

class CoinToss implements ICoinToss {
  constructor(dto: ICoinToss) {
    Object.assign(this, dto);
  }
  start: { start: string; leftSide: string; winner: string };
}

interface IScore {
  home: number;
  away: number;
}

class Score implements IScore {
  constructor(dto: IScore) {
    Object.assign(this, dto);
  }
  home: number;
  away: number;
}

interface IStartingLineup {
  home: number[];
  away: number[];
}

class StartingLineup implements IStartingLineup {
  constructor(dto: IStartingLineup) {
    Object.assign(this, dto);
  }
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
  constructor(dto: ILiberoEvent) {
    Object.assign(this, dto);
  }
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
  constructor(dto: IRallyEvent) {
    dto.startTime = dto.startTime ? new Date(dto.startTime) : null;
    dto.endTime = dto.endTime ? new Date(dto.endTime) : null;
    Object.assign(this, dto);
  }
  point: 'home' | 'away';
  startTime: Date;
  endTime: Date;
}

interface ITimeoutEvent {
  team: 'home' | 'away';
  time: Date;
}

class TimeoutEvent implements ITimeoutEvent {
  constructor(dto: ITimeoutEvent) {
    if (dto.time) dto.time = new Date(dto.time);
    Object.assign(this, dto);
  }
  team: 'home' | 'away';
  time: Date;
}

interface ISubstitutionEvent {
  team: 'home' | 'away';
  time: Date;
  in: number;
  out: number;
}

class SubstitutionEvent implements ISubstitutionEvent {
  constructor(dto: ISubstitutionEvent) {
    if (dto.time) dto.time = new Date(dto.time);
    Object.assign(this, dto);
  }
  team: 'home' | 'away';
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
  constructor(dto: IEvent) {
    if (dto.libero) {
      dto.libero = new LiberoEvent(dto.libero);
    }
    if (dto.rally) {
      dto.rally = new RallyEvent(dto.rally);
    }
    if (dto.timeout) {
      dto.timeout = new TimeoutEvent(dto.timeout);
    }
    if (dto.substitution) {
      dto.substitution = new SubstitutionEvent(dto.substitution);
    }

    Object.assign(this, dto);
  }
  libero: LiberoEvent | null;
  rally: RallyEvent | null;
  timeout: TimeoutEvent | null;
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
  constructor(dto: ISet) {
    dto.score = dto.score ? new Score(dto.score) : null;
    dto.startTime = dto.startTime ? new Date(dto.startTime) : null;
    dto.endTime = dto.endTime ? new Date(dto.endTime) : null;
    dto.startingLineup = dto.startingLineup
      ? new StartingLineup(dto.startingLineup)
      : null;
    dto.events =
      dto.events && Array.isArray(dto.events)
        ? dto.events.map((e) => new Event(e))
        : null;

    Object.assign(this, dto);
  }
  startTime: Date | null;
  endTime: Date | null;
  score: Score;
  duration: number;
  startingLineup: StartingLineup;
  events: Event[];
}

interface IShortPlayer {
  number: number;
  team: 'home' | 'away';
}

class ShortPlayer implements IShortPlayer {
  constructor(dto: IShortPlayer) {
    Object.assign(this, dto);
  }
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

interface IScoutData {
  point: string;
  score: IScore;
  plays: IPlay[];
}

interface IPlayByPlayEvent {
  _id: string;
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
  scoutData: IScoutData[][];
}

class Team implements ITeam {
  constructor(dto: ITeam) {
    dto.staff =
      dto.staff && Array.isArray(dto.staff)
        ? dto.staff.map((s) => new Staff(s))
        : [];

    dto.players =
      dto.players && Array.isArray(dto.players)
        ? dto.players.map((p) => new Player(p))
        : [];

    dto.reserve =
      dto.reserve && Array.isArray(dto.reserve)
        ? dto.reserve.map((p) => new Player(p))
        : [];

    Object.assign(this, dto);
  }
  code: string;
  name: string;
  shortName: string;
  staff: Staff[];
  captain: number;
  libero: number[];
  players: Player[];
  reserve: Player[];
  color: string;
  email: string;
}

class Official implements IOfficial {
  constructor(dto: Official) {
    Object.assign(this, dto);
  }
  firstName: string;
  lastName: string;
  level: string | null;
}

class Scout implements IScout {
  constructor(dto: IScout) {
    dto.ended = dto.ended ? new Date(dto.ended) : null;
    dto.mvp = dto.mvp ? new ShortPlayer(dto.mvp) : null;
    dto.bestPlayer = dto.bestPlayer ? new ShortPlayer(dto.bestPlayer) : null;
    dto.coinToss = dto.coinToss ? new CoinToss(dto.coinToss) : null;
    dto.sets =
      dto.sets && Array.isArray(dto.sets)
        ? dto.sets.map((set) => new Set(set))
        : [];
    Object.assign(this, dto);
  }
  bestPlayer: ShortPlayer | null;
  ended: Date | null;
  mvp: ShortPlayer | null;
  coinToss: CoinToss;
  sets: Set[];
  interruptions: unknown[];
  objections: unknown[];
}

class Settings implements ISettings {
  constructor(dto: ISettings) {
    Object.assign(this, dto);
  }
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
  constructor(dto: IScoutData) {
    dto.score = dto.score ? new Score(dto.score) : null;
    Object.assign(this, dto);
  }
  point: string;
  score: Score;
  plays: IPlay[];
}

export class PlayByPlayEvent implements IPlayByPlayEvent {
  constructor(dto: IPlayByPlayEvent) {
    dto.teams = {
      home: new Team(dto.teams.home),
      away: new Team(dto.teams.away),
    };

    if (dto.officials) {
      if (dto.officials.lineJudge1) {
        dto.officials.lineJudge1 = new Official(dto.officials.lineJudge1);
      }
      if (dto.officials.lineJudge2) {
        dto.officials.lineJudge2 = new Official(dto.officials.lineJudge2);
      }
      if (dto.officials.referee1) {
        dto.officials.referee1 = new Official(dto.officials.referee1);
      }
      if (dto.officials.referee2) {
        dto.officials.referee2 = new Official(dto.officials.referee2);
      }

      if (dto.officials.scorer1) {
        dto.officials.scorer1 = new Official(dto.officials.scorer1);
      }

      if (dto.officials.supervisor) {
        dto.officials.supervisor = new Official(dto.officials.supervisor);
      }
    }

    dto.scout = new Scout(dto.scout);
    dto.settings = new Settings(dto.settings);

    dto.scoutData =
      dto.scoutData?.map((row) => row.map((item) => new ScoutData(item))) ??
      null;

    dto.startDate = new Date(dto.startDate);

    Object.assign(this, dto);
  }

  _id: string;
  startDate: Date;
  teams: { home: Team; away: Team };
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
    referee1: Official | null;
    referee2: Official | null;
    scorer1: Official | null;
    lineJudge1: Official | null;
    lineJudge2: Official | null;
    supervisor: Official | null;
  };
  scout: Scout;
  settings: Settings;
  version: number;
  workTeam: unknown;
  matchId: number;
  scoutData: ScoutData[][];
}

@Injectable()
export class VolleystationSocketService {
  private readonly logger = new Logger(VolleystationSocketService.name);
  private static socket: io.Socket | null = null;
  private static connecting: Promise<void> | null = null;

  private async ensureConnection(): Promise<void> {
    const existingSocket = VolleystationSocketService.socket;

    if (existingSocket?.connected) {
      return;
    }

    if (VolleystationSocketService.connecting) {
      return VolleystationSocketService.connecting;
    }

    VolleystationSocketService.connecting = new Promise((resolve, reject) => {
      const socket = io('wss://api.widgets.volleystation.com', {
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

      socket.once('connect', () => {
        this.logger.log('Socket подключён.');
        VolleystationSocketService.socket = socket;
        VolleystationSocketService.connecting = null;
        resolve();
      });

      socket.once('connect_error', (err) => {
        this.logger.error(`Ошибка подключения: ${err.message}`);
        VolleystationSocketService.connecting = null;
        reject(err);
      });

      socket.once('disconnect', (reason) => {
        this.logger.warn(`Socket отключён: ${reason}`);
      });
    });

    return VolleystationSocketService.connecting;
  }

  public async getMatchInfo(matchId: number): Promise<PlayByPlayEvent | null> {
    await this.ensureConnection();

    const socket = VolleystationSocketService.socket;
    if (!socket?.connected) {
      throw new Error('Socket не подключен.');
    }

    return new Promise((resolve, reject) => {
      socket.emit(
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

          resolve(event ? new PlayByPlayEvent(event) : null);
        },
      );
    });
  }
}
