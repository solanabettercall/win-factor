import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import * as io from 'socket.io-client';
import { MatchId } from 'src/modules/monitoring/domain/value-objects/match-id.vo';

interface IPlayer {
  code: string;
  firstName: string;
  lastName: string;
  isForeign?: boolean;
  isDisabled?: boolean;
  isConfederation?: boolean;
  shirtNumber: number;
  position: number;
  shirtName: string;
}

interface ITeam {
  code: string;
  name: string;
  shortName: string;
  captain: number;
  libero: number[];
  players: IPlayer[];
  reserve: IPlayer[];
  color: string;
  email: string;
}
export interface IPlayByPlayEvent {
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
  round: string;
  competition: string;
  remarks: string;
  matchNumber: string;
  division: string;
  category: string;
  scout: IScout;
  version: number;
  workTeam: unknown;
  matchId: number;
}

interface IScout {
  sets: IMatchSet[];
  ended: Date | null;
}

interface IStartingLineup {
  home: number[];
  away: number[];
}

interface IMatchSet {
  startTime: Date | null;
  endTime: Date | null;
  startingLineup: IStartingLineup;
}

@Injectable()
export class VolleystationLiveMatchApiService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(this.constructor.name);

  constructor() {}
  onApplicationShutdown() {
    this.logger.debug('onModuleDestroy() вызван');
    if (this.socket) {
      this.logger.debug('Удаление всех слушателей сокета');
      this.socket.removeAllListeners();

      if (this.socket.connected) {
        this.logger.debug('Сокет подключён, закрываем');
        this.socket.close();
        this.logger.log('Socket закрыт.');
      }
    }
  }

  private socket: io.Socket;

  private readonly socketUrl =
    process.env.VS_SOCKET_URL || 'wss://api.widgets.volleystation.com';
  private readonly socketToken =
    process.env.VS_SOCKET_TOKEN || 'PhodQuahof1ShmunWoifdedgasvuipki';

  async onApplicationBootstrap() {
    this.socket = io(this.socketUrl, {
      path: '/socket.io/',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      query: { token: this.socketToken },
      extraHeaders: {
        Origin: 'https://widgets.volleystation.com',
        Referer: 'https://widgets.volleystation.com',
      },
    });

    this.setupListeners();

    // const match = await this.getMatchInfo(MatchId.create(2227637));
    // console.log(match?.scout.sets?.[0].startingLineup);
    // console.log(match?.teams.away.players);
  }

  private setupListeners() {
    this.socket.on('connect', () => this.logger.log('Socket подключён.'));
    this.socket.on('disconnect', (reason: string) =>
      this.logger.warn(`Socket отключён: ${reason}`),
    );
    this.socket.on('reconnect_attempt', (attempt: number) =>
      this.logger.log(`Попытка реконнекта #${attempt}`),
    );
    this.socket.on('reconnect', (attempt: number) =>
      this.logger.log(`Успешный реконнект после #${attempt}`),
    );
    this.socket.on('reconnect_error', (err) =>
      this.logger.warn(`Ошибка реконнекта: ${err.message}`),
    );
    this.socket.on('reconnect_failed', () =>
      this.logger.error('Реконнект не удался.'),
    );
  }

  public getMatchInfo(matchId: MatchId): Promise<IPlayByPlayEvent | null> {
    return new Promise((resolve, reject) => {
      const handler = (err: Error, response: { data: IPlayByPlayEvent[] }) => {
        if (err) {
          this.logger.warn(`Ошибка от сервера: ${err.message}`);
          reject(err);
          return null;
        }

        const event = response.data?.[0] ?? null;
        resolve(event);
      };

      this.socket.emit(
        'find',
        'widget/play-by-play',
        {
          matchId,
          $limit: 1,
        },
        handler,
      );
    });
  }
}
