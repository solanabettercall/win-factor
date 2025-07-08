import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import * as cheerio from 'cheerio';

interface IRawComptition {
  id: number;
  name: string;
  url: string;
}

class GetCompeitionDto {
  id: number;
  version: 'website' | 'website2';
}

@Injectable()
export class VolleystationApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpService) {}

  getCompetition(dto: GetCompeitionDto): Observable<IRawComptition | null> {
    const { id, version } = dto;

    const href = `https://panel.volleystation.com/${version}/${id}/en/`;

    // Делаем HTTP GET-запрос с дефолтным поведением (авто-фолловинг редиректов).
    return this.httpService
      .get(href, {
        // По желанию можно явно указать maxRedirects, но по умолчанию Axios даст 5–10 редиректов.
        maxRedirects: 10,
        // Делаем так, чтобы Axios не «крошил» ошибку 403/404, а сразу возвращал ответ
        validateStatus: (status) => status < 500,
      })
      .pipe(
        retry({
          count: 10,
          delay: (error, retryIndex) => {
            const status = error?.response?.status || 0;
            if (status === 404) {
              // если 404 — бьем по исключению, чтобы сразу выйти
              return throwError(() => new NotFoundException());
            }
            if (status === 403) {
              // 403 будем считать конечным и возвращать null
              return of(null).pipe(); // оператор delay на нулевом значении
            }
            const delayTime =
              status === 500 ? 0 : Math.pow(2, retryIndex) * 1000;
            this.logger.warn(
              `Повторная попытка №${retryIndex + 1} через ${delayTime / 1000} сек (статус: ${status})`,
            );
            return of(null).pipe(delay(delayTime));
          },
        }),
        // На этом этапе response уже содержит { data, status, headers, request, ... }
        map((axiosResponse) => {
          // Если сервер вернул 403 или пустой body, просто выходим
          if (!axiosResponse || axiosResponse.status === 403) {
            return null;
          }

          // Получаем HTML-строку:
          const html = axiosResponse.data;
          // cheerio-парсинг, чтобы найти название турнира:
          const $ = cheerio.load(html);

          const hasOgType = !!$('meta[property="og:type"][content="website"]')
            .length;
          if (!hasOgType) {
            // Если мета-тега нет — считаем «невалидной» страницей
            this.logger.warn(
              `Сайт ${href} не содержит og:type=website, пропускаем`,
            );
            return null;
          }

          const name = $('title')
            .text()
            .trim()
            .replaceAll('\n', '')
            .replace('Homepage - ', '');

          // Основное: finalUrl хранится в объекте response.request.res.responseUrl
          // (это свойство доступно, если Axios следовал за редиректами автоматически)
          // Обратите внимание: structure может отличаться, иногда в axiosResponse.request
          // нужно смотреть иной путь — в наших тестах именно response.request.res.responseUrl.
          let finalUrl: string;
          try {
            finalUrl = axiosResponse.request.res.responseUrl as string;
          } catch {
            // если что-то пойдет не так, полагаемся на исходный href
            finalUrl = href;
          }

          const competition: IRawComptition = {
            id,
            name,
            url: finalUrl,
          };
          return competition;
        }),
        catchError((err) => {
          if (err instanceof NotFoundException) {
            this.logger.warn(`Не найдено ${href}`);
            return of(null);
          }
          this.logger.error(`Ошибка при обработке ${href}: ${err.message}`);
          return of(null);
        }),
      );
  }
}
