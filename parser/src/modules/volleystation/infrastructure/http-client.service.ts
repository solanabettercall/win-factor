import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig, HttpStatusCode } from 'axios';
import axiosRetry from 'axios-retry';
import { catchError, firstValueFrom, map, of, switchMap } from 'rxjs';
import { RedisService } from 'src/shared/infrastructure/cache/redis.service';

export interface HttpResponse<T> {
  data: T;
  finalUrl: string;
}

const CACHE_TTL_SEC = 5 * 60;

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(this.constructor.name);

  private cache: Map<string, any> = new Map<string, any>();

  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {
    this.setupRetrySettings(httpService);
  }

  private setupRetrySettings(httpService: HttpService) {
    axiosRetry(httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryCount, err: AxiosError) => {
        const { message } = err;

        this.logger.log(
          `[${message}] Попытка повторного запроса №${retryCount}`,
        );
        return retryCount * 1000;
      },
      retryCondition: (err: AxiosError) => {
        const { status, config } = err;
        const url = config?.url;
        if (url) this.logger.debug(`[${status}] ${url}`);
        if (status === HttpStatusCode.NotFound) {
          return false;
        } else {
          return true;
        }
      },
    });
  }

  private config: AxiosRequestConfig = {
    maxRedirects: 5,
    validateStatus: (status) => status <= 300,
    responseType: 'json',
  };

  async get<T = string>(url: string): Promise<HttpResponse<T> | null> {
    const cached = await this.redisService.getJson<HttpResponse<T>>(url);
    if (cached) {
      this.logger.verbose(`Кэш хит: ${url}`);
      return cached;
    }

    return firstValueFrom(
      this.httpService
        .get<T>(url, {
          ...this.config,
          headers: {
            Accept: 'application/json',
          },
        })
        .pipe(
          map(
            (httpRes) =>
              ({
                data: httpRes.data,
                finalUrl: httpRes.request?.res?.responseUrl || url,
              }) as HttpResponse<T>,
          ),

          switchMap(async (result) => {
            await this.redisService.setJson(url, result, CACHE_TTL_SEC);
            return result;
          }),

          catchError(() => {
            return of(null);
          }),
        ),
    );
  }
}
