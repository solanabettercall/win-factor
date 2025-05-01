import { Injectable, Logger } from '@nestjs/common';
import * as io from 'socket.io-client';

interface IPerson {
  firstName: string;
  lastName: string;
}

interface IStaff {
  type: string;
  person: IPerson;
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
  level?: string;
}

interface ICointToss {
  start: {
    start: string;
    leftSide: string;
    winner: string;
  };
}

interface IScore {
  home: number;
  away: number;
}

interface IStartingLineup {
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

interface IRallyEvent {
  point?: 'home' | 'away';
  startTime: string;
  endTime?: string;
}

interface ITimeoutEvent {
  team: 'home' | 'away';
  time: string;
}

interface ISubstitutionEvent {
  team: 'home' | 'away';
  time: string;
  in: number;
  out: number;
}

interface IEvent {
  libero?: ILiberoEvent;
  rally?: IRallyEvent;
  timeout?: ITimeoutEvent;
  substitution?: ISubstitutionEvent;
}

interface ISet {
  startTime: string;
  endTime: string;
  score: IScore;
  duration: number;
  startingLineup: IStartingLineup;
  events: IEvent[];
}

interface IScout {
  coinToss: ICointToss;
  sets: ISet[];
  interruptions: unknown[];
  objections: unknown[];
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
    referee1: IOfficial;
    referee2: IOfficial;
    scorer1: IOfficial;
    lineJudge1: IOfficial;
    lineJudge2: IOfficial;
  };
  scout: IScout;
  settings: ISettings;
  version: number;
  workTeam: unknown;
  matchId: number;
  scoutData: IScoutData[][];
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

      socket.on('connect', () => {
        this.logger.log('Socket подключён.');
        VolleystationSocketService.socket = socket;
        VolleystationSocketService.connecting = null;
        resolve();
      });

      socket.on('connect_error', (err) => {
        this.logger.error(`Ошибка подключения: ${err.message}`);
        VolleystationSocketService.connecting = null;
        reject(err);
      });

      socket.on('disconnect', (reason) => {
        this.logger.warn(`Socket отключён: ${reason}`);
      });
    });

    return VolleystationSocketService.connecting;
  }

  public async getMatchInfo(matchId: number): Promise<IPlayByPlayEvent | null> {
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
        (err: Error, response: { data: IPlayByPlayEvent[] }) => {
          if (err) {
            this.logger.warn(`Ошибка от сервера: ${err.message}`);
            return reject(err);
          }

          const event = response.data?.[0] ?? null;
          resolve(event);
        },
      );
    });
  }
}
