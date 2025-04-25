import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom, retry } from 'rxjs';
import * as cheerio from 'cheerio';
import { CompetitionLink } from './interfaces/competition-link.interface';
import { HttpService } from '@nestjs/axios';
import * as UrlParse from 'url-parse';

@Injectable()
export class CompetitionService {
  private readonly logger = new Logger(CompetitionService.name);

  private readonly BASE_DOMAIN = 'cev.eu';

  constructor(private readonly httpService: HttpService) {}

  public async fetchCompetitionLinks(
    competitionLinks: Pick<CompetitionLink, 'href'>[],
  ) {
    for (const { href } of competitionLinks) {
      try {
        const { status } = await firstValueFrom(
          this.httpService.get(href).pipe(
            retry(3),
            catchError((err) => {
              this.logger.error(`Ошибка при получении ${href}: ${err.message}`);
              throw err;
            }),
          ),
        );
        this.logger.debug(`${status}: ${href}`);
      } catch (error) {
        this.logger.error(`Не удалось загрузить ${href}: ${error.message}`);
      }
    }
  }

  private normalizeRawHref(href: string): string {
    const parsedUrl = UrlParse(href);

    parsedUrl.set('protocol', 'https:');
    if (!parsedUrl.hostname || !parsedUrl.host) {
      parsedUrl.set('host', this.BASE_DOMAIN);
      parsedUrl.set('hostname', this.BASE_DOMAIN);
    }
    return parsedUrl.href;
  }

  public async parseCompetitionLinks(): Promise<CompetitionLink[]> {
    const competitions: CompetitionLink[] = [];

    const { data } = await firstValueFrom(
      this.httpService.get('https://www.cev.eu'),
    );

    const $ = cheerio.load(data);

    $('li.c-nav__list__item').each((_, menuItem) => {
      const menuTitleEl = $(menuItem).find('a.menuItem');
      if (!menuTitleEl.length) return;

      const menuTitle = menuTitleEl.text().trim();

      $(menuItem)
        .find('div.menuSlab')
        .each((_, slab) => {
          $(slab)
            .find('div.menuSlab__row')
            .each((_, row) => {
              $(row)
                .find('div')
                .each((_, rowItem) => {
                  const titleEl = $(rowItem).find('a.title');
                  if (!titleEl.length) return;

                  const title = titleEl.text().trim();

                  $(rowItem)
                    .find('li')
                    .each((_, item) => {
                      const atag = $(item).find('a');
                      if (!atag.length) return;

                      const itemTitle = atag.attr('title')?.trim();
                      const href = atag.attr('href')?.trim();
                      const string = `${menuTitle} - ${title} - ${itemTitle} (${href})`;

                      const blockedKeywords = [
                        'ranking',
                        'history',
                        'multi-sport events',
                        'latest',
                        'beach',
                        'snow',
                        'nationals',
                      ];

                      const canAppend = !blockedKeywords.some((block) =>
                        string.toLowerCase().includes(block),
                      );

                      if (canAppend && itemTitle && href) {
                        const normalizedLink = this.normalizeRawHref(href);
                        competitions.push({
                          menuTitle,
                          title,
                          itemTitle,
                          href: normalizedLink,
                        });
                      }
                    });
                });
            });
        });
    });

    return competitions;
  }
}
