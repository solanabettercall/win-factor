import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as io from 'socket.io-client';
import { plainToInstance } from 'class-transformer';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface IVolleystationSocketService {
  getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null>;
}

@Injectable()
export class VolleystationSocketService
  implements OnModuleInit, IVolleystationSocketService
{
  private readonly logger = new Logger(VolleystationSocketService.name);
  private socket: io.Socket;
  private isDestroying = false;

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
        reconnection: false, // Отключаем автоматические реконнекты
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

    this.socket.on('connect', () => {
      this.logger.debug('Событие connect');
      this.logger.log('Socket подключён.');
      this.isDestroying = false; // сброс флага при успешном подключении
    });

    this.socket.on('disconnect', (reason: string) => {
      this.logger.debug(`Событие disconnect: ${reason}`);
      this.logger.warn(`Socket отключён: ${reason}`);
      if (!this.isDestroying) {
        this.isDestroying = true;
        this.attemptRestart();
      }
    });

    // НЕ слушаем connect_error - он вызывает stack overflow!
    // Вместо этого используем таймаут для проверки подключения
    setTimeout(() => {
      if (!this.socket.connected && !this.isDestroying) {
        this.logger.warn('Сокет не подключился за 10 секунд - перезапускаем');
        this.isDestroying = true;
        this.attemptRestart();
      }
    }, 10000); // 10 секунд на подключение
  }

  private attemptRestart() {
    setTimeout(() => {
      try {
        this.logger.log('Попытка перезапуска сокета');
        // НЕ закрываем старый сокет - просто забываем про него
        // Пусть GC сам его уберет, чтобы избежать stack overflow
        if (this.socket) {
          try {
            this.socket.removeAllListeners();
          } catch (e) {
            // Игнорируем любые ошибки при удалении listeners
          }
        }

        // Создаем новый сокет
        this.socket = this.createSocket();
        this.setupListeners();
        this.isDestroying = false;
      } catch (err) {
        this.logger.error(`Ошибка при перезапуске сокета: ${err.message}`);
        // Повторная попытка через большую задержку
        setTimeout(() => this.attemptRestart(), 15000);
      }
    }, 5000); // Задержка между попытками 5 секунд
  }

  public getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null> {
    // this.logger.debug(`getMatchInfo(${matchId}) вызван`);
    return new Observable<PlayByPlayEvent | null>((observer) => {
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

      // this.logger.debug('Отправка socket.emit(find)');
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
        this.socket.off('find', handler);
      };
    }).pipe(
      timeout(10000), // 10 секунд таймаут
      catchError((err) => {
        this.logger.warn(
          `Таймаут запроса для матча ${matchId}: ${err.message}`,
        );
        return of(null); // Возвращаем null при ошибке
      }),
    );
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
