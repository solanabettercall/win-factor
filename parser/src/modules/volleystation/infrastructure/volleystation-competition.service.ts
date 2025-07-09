import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';
import { CompetitionVersion } from 'src/modules/monitoring/domain/value-objects/competition-version.vo';

export interface IRawComptition {
  id: number;
  name: string;
  url: string;
  version: CompetitionVersion;
}

class GetCompeitionDto {
  id: number;
  version: CompetitionVersion;
}

@Injectable()
export class VolleystationCompetitionApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpClientService) {}

  async getCompetition(dto: GetCompeitionDto): Promise<IRawComptition | null> {
    const { id, version } = dto;
    const url = `https://panel.volleystation.com/${version}/${id}/en/`;

    try {
      const response = await this.httpService.get<string>(url);
      if (!response) return null;
      const $ = cheerio.load(response.data);

      if (!$('meta[property="og:type"][content="website"]').length) {
        this.logger.warn(`Сайт ${url} не содержит og:type=website, пропускаем`);
        return null;
      }

      const name = $('title')
        .text()
        .trim()
        .replaceAll('\n', '')
        .replace('Homepage - ', '');

      const finalUrl = response.finalUrl;

      return {
        id,
        name,
        url: finalUrl,
        version,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Не найдено ${url}`);
      } else {
        this.logger.error(`Ошибка при обработке ${url}: ${error.message}`);
      }
      return null;
    }
  }
}
