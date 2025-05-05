import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as io from 'socket.io-client';
import { plainToInstance } from 'class-transformer';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';
import { Observable } from 'rxjs';

export interface IVolleystationSocketService {
  getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null>;
}

@Injectable()
export class VolleystationSocketService
  implements OnModuleInit, IVolleystationSocketService
{
  private readonly logger = new Logger(VolleystationSocketService.name);
  private socket: io.Socket;

  private readonly socketUrl =
    process.env.VS_SOCKET_URL || 'wss://api.widgets.volleystation.com';
  private readonly socketToken =
    process.env.VS_SOCKET_TOKEN || 'PhodQuahof1ShmunWoifdedgasvuipki';

  private createSocket(): io.Socket {
    return io(this.socketUrl, {
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
  }

  async onModuleInit() {
    this.socket = this.createSocket();

    this.setupListeners();

    try {
      await this.waitForConnection();
    } catch (err) {
      this.logger.error(`Ошибка подключения при инициализации: ${err.message}`);
    }
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      this.logger.log('Socket подключён.');
    });

    this.socket.on('disconnect', (reason: string) => {
      this.logger.warn(`Socket отключён: ${reason}`);
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.logger.log(`Попытка реконнекта #${attempt}`);
    });

    this.socket.on('reconnect', (attempt: number) => {
      this.logger.log(`Успешный реконнект после #${attempt}`);
    });

    this.socket.on('reconnect_error', (err) => {
      this.logger.warn(`Ошибка реконнекта: ${err.message}`);
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('Реконнект не удался.');
    });
  }

  public getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null> {
    return new Observable((observer) => {
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
            observer.error(err);
            return;
          }

          const event = response.data?.[0] ?? null;
          observer.next(event ? plainToInstance(PlayByPlayEvent, event) : null);
          observer.complete();
        },
      );
    });
  }

  async onModuleDestroy() {
    if (this.socket && this.socket.connected) {
      this.socket.close();
      this.logger.log('Socket закрыт.');
    }
  }
}
