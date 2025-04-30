import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

export interface CompetitionLink {
  menuTitle: string;
  title: string;
  itemTitle: string;
  href: string;
}

@Injectable()
export class CveService {
  constructor(private readonly httpService: HttpService) {}

  public async parseCompetitions(): Promise<CompetitionLink[]> {
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
                        competitions.push({
                          menuTitle,
                          title,
                          itemTitle,
                          href,
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
