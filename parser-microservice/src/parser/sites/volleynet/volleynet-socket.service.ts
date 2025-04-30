import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
const io = require('socket.io-client');

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
  startDate: string;
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
export class VolleynetSocketService implements OnModuleInit {
  private readonly logger = new Logger(VolleynetSocketService.name);

  async onModuleInit() {
    // this.connectMatch(2196979);
  }

  private connectMatch(matchId: number) {
    const socket = io('wss://api.widgets.volleystation.com', {
      path: '/socket.io/',
      transports: ['websocket'],
      query: {
        connectionPathName: `/court/${matchId}`,
        token: 'PhodQuahof1ShmunWoifdedgasvuipki',
      },
      extraHeaders: {
        Origin: 'https://widgets.volleystation.com',
        Referer: `https://widgets.volleystation.com/court/${matchId}`,
      },
    });

    socket.on('connect', () => {
      this.logger.debug('Подключен к серверу!');
    });

    socket.on('disconnect', (reason) => {
      this.logger.warn('Отключен:', reason);
    });

    socket.on('connect_error', (err) => {
      this.logger.error('Ошибка подключения:', err.message);
    });

    socket.on('widget/play-by-play created', (data: IPlayByPlayEvent) => {
      for (const event of data.scout.sets.flatMap((s) => s.events)) {
        console.log(event);
      }
    });

    socket.on('widget/play-by-play updated', (data: IPlayByPlayEvent) => {
      for (const event of data.scout.sets.flatMap((s) => s.events)) {
        console.log(event);
      }
    });
  }
}
