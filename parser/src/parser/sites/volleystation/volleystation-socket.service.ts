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
    this.logger.debug('createSocket() вызван');
    try {
      const socket = io(this.socketUrl, {
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

      this.logger.debug('Сокет создан');
      return socket;
    } catch (error) {
      this.logger.error(`Ошибка создания сокета: ${error.message}`);
      throw error;
    }
  }

  async onModuleInit() {
    this.logger.debug('onModuleInit() вызван');
    try {
      this.socket = this.createSocket();
      this.setupListeners();
      this.logger.debug('вышли из setupListeners()');
      await this.waitForConnection();
    } catch (err) {
      this.logger.error(`Ошибка подключения при инициализации: ${err.message}`);
    }
  }

  private waitForConnection(): Promise<void> {
    this.logger.debug('waitForConnection() вызван');
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.logger.debug('onConnect событие');
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        this.logger.debug(`onError событие: ${err.message}`);
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.logger.debug('cleanup() вызван');
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
      };

      this.logger.debug('Подписка на события подключения');
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  private setupListeners() {
    this.logger.debug('setupListeners() вызван');

    this.socket.once('connect', () => {
      this.logger.debug('Событие connect');
      this.logger.log('Socket подключён.');
    });

    this.socket.once('disconnect', (reason: string) => {
      this.logger.debug(`Событие disconnect: ${reason}`);
      this.logger.warn(`Socket отключён: ${reason}`);
    });

    this.socket.once('reconnect_attempt', (attempt: number) => {
      this.logger.debug(`Событие reconnect_attempt #${attempt}`);
      this.logger.log(`Попытка реконнекта #${attempt}`);
    });

    this.socket.once('reconnect', (attempt: number) => {
      this.logger.debug(`Событие reconnect #${attempt}`);
      this.logger.log(`Успешный реконнект после #${attempt}`);
    });

    this.socket.once('reconnect_error', (err) => {
      this.logger.debug(`Событие reconnect_error: ${err.message}`);
      this.logger.warn(`Ошибка реконнекта: ${err.message}`);
    });

    this.socket.once('reconnect_failed', () => {
      this.logger.debug('Событие reconnect_failed');
      this.logger.error('Реконнект не удался.');
    });
  }

  public getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null> {
    this.logger.debug(`getMatchInfo(${matchId}) вызван`);
    return new Observable((observer) => {
      const handler = (err: Error, response: { data: PlayByPlayEvent[] }) => {
        if (err) {
          this.logger.debug(`Ошибка в обработчике find: ${err.message}`);
          this.logger.warn(`Ошибка от сервера: ${err.message}`);
          observer.error(err);
          return;
        }

        const event = response.data?.[0] ?? null;
        observer.next(event ? plainToInstance(PlayByPlayEvent, event) : null);
        observer.complete();
      };

      this.logger.debug('Отправка socket.emit(find)');
      this.socket.emit(
        'find',
        'widget/play-by-play',
        {
          matchId,
          $limit: 1,
        },
        handler,
      );

      return () => {
        this.logger.debug('Отписка от socket.find');
        this.socket.off('find', handler);
      };
    });
  }

  async onModuleDestroy() {
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
}
