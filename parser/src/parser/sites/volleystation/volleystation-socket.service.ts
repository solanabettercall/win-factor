import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as WebSocket from 'ws';
import { plainToInstance } from 'class-transformer';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';
import { Observable, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

export interface IVolleystationSocketService {
  getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null>;
}

@Injectable()
export class VolleystationSocketService
  implements OnModuleInit, OnModuleDestroy, IVolleystationSocketService
{
  private readonly logger = new Logger(VolleystationSocketService.name);
  private socket: WebSocket | null = null;
  private isDestroying = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private pingIntervalMs = 25000;

  private readonly socketUrl =
    process.env.VS_SOCKET_URL ||
    'wss://api.widgets.volleystation.com/socket.io/?connectionPathName=%2Fplay-by-play%2F2161020&token=PhodQuahof1ShmunWoifdedgasvuipki&EIO=3&transport=websocket';

  private createSocket(): WebSocket {
    this.logger.debug('createSocket() вызван');

    const ws = new WebSocket(this.socketUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Origin: 'https://volleystation.com',
        Referer: 'https://volleystation.com',
      },
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
      ].join(':'),
    });

    ws.on('open', () => {
      this.logger.log('✅ Подключено к серверу Volleystation');
      ws.send('40'); // handshake namespace (Socket.IO Engine.IO v3)
      this.isDestroying = false;
      this.startPing();
    });

    ws.on('message', (data) => this.handleMessage(data.toString()));
    ws.on('close', (code, reason) => {
      this.logger.warn(`🔌 Socket закрыт (${code}): ${reason}`);
      this.stopPing();
      if (!this.isDestroying) this.restart();
    });
    ws.on('error', (err) => {
      this.logger.error(`❌ Socket ошибка: ${err.message}`);
      if (!this.isDestroying) this.restart();
    });

    return ws;
  }

  private startPing() {
    this.stopPing();
    this.logger.log(`📡 Запуск ping каждые ${this.pingIntervalMs}ms`);

    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.logger.debug('🏓 Sending ping');
        this.socket.send('2');
      }
    }, this.pingIntervalMs);
  }

  private stopPing() {
    if (this.pingInterval) {
      this.logger.debug('🛑 Остановка ping');
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async onModuleInit() {
    this.logger.debug('onModuleInit() вызван');
    this.socket = this.createSocket();
  }

  private restart() {
    this.isDestroying = true;
    setTimeout(() => {
      this.logger.log('♻️ Перезапуск соединения...');
      try {
        this.socket?.removeAllListeners();
        this.socket = this.createSocket();
      } catch (e) {
        this.logger.error(`Ошибка при перезапуске: ${e.message}`);
      } finally {
        this.isDestroying = false;
      }
    }, 5000);
  }

  private handleMessage(msg: string) {
    this.logger.debug(`⬇️ Received: ${msg}`);

    if (msg.startsWith('0')) {
      try {
        const jsonStart = msg.indexOf('{');
        const handshake = JSON.parse(msg.slice(jsonStart));
        if (handshake.pingInterval) {
          this.pingIntervalMs = handshake.pingInterval;
          this.logger.log(
            `🕒 Ping interval установлен: ${this.pingIntervalMs}ms`,
          );
        }
        this.logger.debug(
          `🤝 Handshake: sid=${handshake.sid}, pingInterval=${handshake.pingInterval}, pingTimeout=${handshake.pingTimeout}`,
        );
      } catch (err) {
        this.logger.warn(`Ошибка парсинга handshake: ${err.message}`);
      }
    } else if (msg.startsWith('42')) {
      try {
        const jsonStart = msg.indexOf('[');
        const payload = JSON.parse(msg.slice(jsonStart));
        this.logger.debug(`📥 Event payload: ${JSON.stringify(payload)}`);
      } catch (err) {
        this.logger.warn(`Ошибка разбора сообщения: ${err.message}`);
      }
    } else if (msg === '3') {
      this.logger.debug('🏓 Pong received');
    } else if (msg === '2') {
      this.logger.debug('🏓 Ping received, sending pong');
      this.socket?.send('3');
    }
  }

  public getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null> {
    return new Observable<PlayByPlayEvent | null>((observer) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.logger.warn('Сокет не готов, отклоняем запрос');
        observer.next(null);
        observer.complete();
        return;
      }

      const findPayload = `421["find","widget/play-by-play",{"matchId":${matchId},"$limit":1}]`;
      this.socket.send(findPayload);
      this.logger.debug(`📤 Отправлено find: ${findPayload}`);

      const onMessage = (data: WebSocket.RawData) => {
        const text = data.toString();

        if (text.startsWith('431')) {
          try {
            const jsonStart = text.indexOf('[');
            const [, response] = JSON.parse(text.slice(jsonStart));
            const matchData = response?.data?.[0];

            if (!matchData?._id) {
              this.logger.warn(`Матч ${matchId} не найден`);
              observer.next(null);
              observer.complete();
              this.socket?.off('message', onMessage);
              return;
            }

            const objectId = matchData._id;
            this.logger.debug(`🔍 Найден ObjectId: ${objectId}`);

            observer.next(plainToInstance(PlayByPlayEvent, matchData));
            observer.complete();
            this.socket?.off('message', onMessage);
          } catch (err) {
            this.logger.error(`Ошибка парсинга find ответа: ${err.message}`);
            observer.error(err);
            this.socket?.off('message', onMessage);
          }
        }
      };

      this.socket.on('message', onMessage);

      return () => {
        this.socket?.off('message', onMessage);
      };
    }).pipe(
      timeout(10000),
      catchError((err) => {
        this.logger.warn(`Таймаут запроса: ${err.message}`);
        return of(null);
      }),
    );
  }

  async onModuleDestroy() {
    this.logger.debug('onModuleDestroy() вызван');
    this.stopPing();
    if (this.socket) {
      this.isDestroying = true;
      this.socket.removeAllListeners();
      this.socket.close();
      this.logger.log('Socket закрыт.');
    }
  }
}
