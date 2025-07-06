import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { RedisAdapter } from '@grammyjs/storage-redis';
import Redis from 'ioredis';
import {
  createBackMainMenuButtons,
  MenuMiddleware,
  MenuTemplate,
} from 'grammy-inline-menu';
import { firstValueFrom } from 'rxjs';
import { appConfig } from 'src/config/parser.config';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { plainToInstance } from 'class-transformer';
import { FormattingService } from './formating.service';
import { CompetitionService } from 'src/monitoring/competition.service';
import { MonitoringService } from 'src/monitoring/monitoring.service';
import { Competition } from 'src/monitoring/schemas/competition.schema';
import {
  MatchNotificationPayload,
  PlayerWithStatistic,
} from 'src/match-watcher/match-watcher.service.service';
import { OnEvent } from '@nestjs/event-emitter';
import { addHours, format } from 'date-fns';
import { Player } from 'src/parser/sites/volleystation/models/team-roster/player';

interface SessionData {
  page: number;
  selectedCompetition?: Competition;
  selectedTeam?: Team;
}

type MyCtx = Context & SessionFlavor<SessionData>;

function getSessionKey(ctx: Context): string | undefined {
  return ctx.chat?.id.toString();
}

const initialSession = (): SessionData => ({
  page: 1,
});

type MenuTemplateType =
  | 'main'
  | 'allCompetitions'
  | 'competition'
  | 'team'
  | 'monitoredCompetitions'
  | 'monitoredCompetition';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly bot: Bot<MyCtx>;
  private readonly redis: Redis;
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly competitionService: CompetitionService,
    private readonly formattingService: FormattingService,
  ) {
    const { telegram, redis } = appConfig();
    this.bot = new Bot<MyCtx>(telegram.botToken);
    this.redis = new Redis(redis);
  }

  @OnEvent('match.notification')
  async handle(payload: MatchNotificationPayload) {
    const { channelId } = appConfig().telegram;
    if (!channelId) return;

    const { match, competition, home, away } = payload;
    const matchTime = format(
      addHours(new Date(match.startDate), 3),
      'dd.MM.yyyy HH:mm',
    );

    const formatPosition = (position: string) => {
      switch (position) {
        case 'middle blocker':
          return 'MB';
        case 'setter':
          return 'S';
        case 'outside hitter':
          return 'OH';
        case 'blocker':
          return 'B';
        case 'opposite':
          return 'O';
        case 'libero':
          return 'L';
        default:
          return position;
      }
    };

    const formatPlayerList = (list: PlayerWithStatistic[], symbol: string) => {
      if (list.length === 0) {
        return null;
      }
      const lines = [];
      const playersWithRating = list.map((p) => {
        let rating: { rank: number; points: number; sets: number } | null =
          null;

        if (p.statistic?.pointsScored && p.statistic?.setsPlayed) {
          rating = {
            points: p.statistic.pointsScored,
            rank: p.statistic.pointsScored / p.statistic.setsPlayed,
            sets: p.statistic.setsPlayed,
          };
        }

        return {
          player: p,
          rating,
        };
      });

      // Сортировка: сначала игроки с рейтингом (по убыванию), потом без рейтинга
      playersWithRating.sort((a, b) => {
        // Если у a есть рейтинг, а у b нет — a выше
        if (a.rating && !b.rating) return -1;
        // Если у b есть рейтинг, а у a нет — b выше
        if (!a.rating && b.rating) return 1;
        // Оба без рейтинга — равны
        if (!a.rating && !b.rating) return 0;
        // Оба с рейтингом — сравниваем по убыванию
        return b.rating!.rank - a.rating!.rank;
      });

      // Формирование строк в нужном порядке
      for (const item of playersWithRating) {
        const p = item.player;
        const rating = item.rating;

        const playerLines = [];

        playerLines.push(
          `- ${symbol} № ${p.number}: ${p.name} (<i>${formatPosition(p.position)}</i>)`,
        );

        if (rating) {
          playerLines.push(
            `Рейтинг: ${rating.rank.toFixed(2)} (${rating.points}/${rating.sets})`,
          );
        }

        lines.push(playerLines.join('\n'));
      }

      return lines.join('\n');

      // return list.length > 0
      //   ? list
      //       .map(
      //         (p) =>
      //           // `${symbol} №${p.number} <b>${p.name}</b> (<i>${formatPositin(p.position)}</i>)`,
      //           `- ${symbol} № ${p.number}: ${p.name} (<i>${formatPosition(p.position)}</i>)` +
      //           `\nРейтинг: 4.34 (495/114)`,
      //       )
      //       .join('\n')
      //   : null;
    };

    const formatTeamBlock = (
      teamName: string,
      onField: PlayerWithStatistic[],
      onBench: PlayerWithStatistic[],
      notDeclared: PlayerWithStatistic[],
      colorEmoji: string,
    ) => {
      const lines = [`<b>${colorEmoji} ${teamName}</b>`];
      lines.push('\n');

      const notDeclaredBlock = formatPlayerList(notDeclared, '⚪️');
      if (notDeclaredBlock) {
        lines.push('❌ <b>Не заявлены:</b>');
        lines.push(notDeclaredBlock);
        lines.push('\n');
      }
      const benchBlock = formatPlayerList(onBench, '🔘');
      if (benchBlock) {
        lines.push('🪑 <b>На скамейке::</b>');
        lines.push(benchBlock);
        lines.push('\n');
      }

      const fieldBlock = formatPlayerList(onField, '🟢');
      if (fieldBlock) {
        lines.push('👥 <b>Основной состав::</b>');
        lines.push(fieldBlock);
        lines.push('\n');
      }

      return lines.join('\n').replaceAll('\n\n\n', '\n\n');
    };

    const message = `
<a href="${competition.url}">🏆 ${competition.name}</a>
🕒 ${matchTime}

<b>🏐 ${match.teams.home.name} vs ${match.teams.away.name}</b>

${formatTeamBlock(
  match.teams.home.name,
  home.onField,
  home.onBench,
  home.notDeclared,
  '🔴',
)}${formatTeamBlock(
      match.teams.away.name,
      away.onField,
      away.onBench,
      away.notDeclared,
      '🔵',
    )}🔗 <a href="https://widgets.volleystation.com/play-by-play/${match.matchId}">Подробнее</a>
`.trim();

    await this.bot.api.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: true,
      },
    });
  }

  private readonly templates: Record<MenuTemplateType, MenuTemplate<MyCtx>> = {
    allCompetitions: new MenuTemplate<MyCtx>(async () => {
      return this.formattingService.allCompetitionsTitle();
    }),
    competition: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = parseInt(ctx.match[1]);
      this.logger.verbose('Отрисовали список турниров');

      const selectedCompetition = await firstValueFrom(
        this.competitionService.getCompetitionById(id),
      );

      ctx.session.selectedCompetition = selectedCompetition;
      const competitionTitle = this.formattingService.competitionTitle(
        ctx.session.selectedCompetition,
      );
      return {
        disable_web_page_preview: true,
        ...competitionTitle,
      };
    }),
    main: new MenuTemplate<MyCtx>(() => {
      return this.formattingService.mainMenuTitle();
    }),
    team: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = ctx.match[2];
      const selectedTeam = await firstValueFrom(
        this.monitoringService.getTeamById(ctx.session.selectedCompetition, id),
      );
      ctx.session.selectedTeam = selectedTeam;
      return this.formattingService.teamTitle(
        ctx.session.selectedCompetition,
        ctx.session.selectedTeam,
      );
    }),
    monitoredCompetitions: new MenuTemplate<MyCtx>(() => {
      return this.formattingService.monitoredCompetitionsTitle();
    }),
    monitoredCompetition: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = parseInt(ctx.match[1]);
      this.logger.verbose('Отрисовали список турниров в мониторинге');
      const selectedCompetition = await firstValueFrom(
        this.competitionService.getCompetitionById(id),
      );
      ctx.session.selectedCompetition = selectedCompetition;
      return this.formattingService.monitoredCompetitionTitle(
        ctx.session.selectedCompetition,
      );
    }),
  };

  private buildTemplates() {
    this.templates.main.submenu('ac', this.templates.allCompetitions, {
      text: this.formattingService.allCompetitionsButton(),
    });
    this.templates.main.submenu('mcs', this.templates.monitoredCompetitions, {
      text: this.formattingService.monitoredCompetitionsButton(),
    });

    this.templates.team.select('player', {
      choices: async (ctx) => {
        const competition = ctx.session.selectedCompetition;
        const team = ctx.session.selectedTeam;
        const teamRoster = await firstValueFrom(
          this.monitoringService.getTeam({ competition, teamId: team.id }),
        );

        return (
          teamRoster.players
            .sort((a, b) => a.number - b.number)
            // .map((player) => `#${player.number} ${player.name}`);
            .map((player) => player.id)
        );

        // return teamRoster.players
        //   .sort((a, b) => a.number - b.number)
        //   .reduce<Record<string, string>>((acc, player) => {
        //     acc[player.id.toString()] = `#${player.number} ${player.name}`;
        //     return acc;
        //   }, {});
      },

      formatState: async (context, textResult, state, key) => {
        const competition = context.session.selectedCompetition;
        const team = context.session.selectedTeam;
        const { players } = await firstValueFrom(
          this.monitoringService.getTeam({ competition, teamId: team.id }),
        );

        const player = players.find((p) => p.id == parseInt(key));

        return `${state ? '✅' : ''} #${player.number} ${player.name}`;
      },
      isSet: async (ctx, key) => {
        console.log(ctx);
        const playerId = parseInt(key);
        const isSelected = await firstValueFrom(
          this.monitoringService.isPlayerMonitored({
            competitionId: ctx.session.selectedCompetition.id,
            teamId: ctx.session.selectedTeam.id,
            playerId,
          }),
        );
        return isSelected;
      },
      set: async (ctx, key, newState) => {
        const playerId = parseInt(key);
        if (newState) {
          await firstValueFrom(
            this.monitoringService.addToMonitoring({
              playerId,
              competitionId: ctx.session.selectedCompetition.id,
              teamId: ctx.session.selectedTeam.id,
            }),
          );
        } else {
          await firstValueFrom(
            this.monitoringService.removeFromMonitoring({
              playerId,
              competitionId: ctx.session.selectedCompetition.id,
              teamId: ctx.session.selectedTeam.id,
            }),
          );
        }
        return true;
      },
      columns: 1,
      getCurrentPage: async (ctx) => ctx.session.page,
      setPage: (ctx, pg) => {
        ctx.session.page = pg;
      },
      maxRows: 30,
      showFalseEmoji: true,
    });
    this.templates.team.manualRow(
      createBackMainMenuButtons(
        this.formattingService.backButtonText(),
        this.formattingService.homeButtonText(),
      ),
    );

    this.templates.competition.chooseIntoSubmenu('team', this.templates.team, {
      choices: async (ctx) => {
        const competition = ctx.session.selectedCompetition;
        const teams = await firstValueFrom(
          this.monitoringService.getTeams(competition),
        );
        return teams.reduce<Record<string, string>>((acc, team) => {
          acc[team.id.toString()] = team.name;
          return acc;
        }, {});
      },
      columns: 2,
      getCurrentPage: async (ctx) => ctx.session.page,
      setPage: (ctx, pg) => {
        ctx.session.page = pg;
      },
    });
    this.templates.competition.manualRow(
      createBackMainMenuButtons(
        this.formattingService.backButtonText(),
        this.formattingService.homeButtonText(),
      ),
    );

    this.templates.allCompetitions.chooseIntoSubmenu(
      'competition',
      this.templates.competition,
      {
        choices: async () => {
          const competitions = await firstValueFrom(
            this.competitionService.getCompetitions(),
          );
          return competitions.reduce<Record<string, string>>(
            (acc, competition) => {
              acc[competition.id.toString()] = competition.name;
              return acc;
            },
            {},
          );
        },
        columns: 1,
        getCurrentPage: async (ctx) => ctx.session.page,
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.allCompetitions.manualRow(
      createBackMainMenuButtons(
        this.formattingService.backButtonText(),
        this.formattingService.homeButtonText(),
      ),
    );

    this.templates.monitoredCompetitions.chooseIntoSubmenu(
      'competition',
      this.templates.monitoredCompetition,
      {
        choices: async () => {
          const competitions = await firstValueFrom(
            this.monitoringService.getMonitoredCompetitions(),
          );
          return competitions.reduce<Record<string, string>>(
            (acc, competition) => {
              acc[competition.id.toString()] = competition.name;
              return acc;
            },
            {},
          );
        },
        columns: 1,
        getCurrentPage: async (ctx) => ctx.session.page,
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.monitoredCompetitions.manualRow(
      createBackMainMenuButtons(
        this.formattingService.backButtonText(),
        this.formattingService.homeButtonText(),
      ),
    );

    this.templates.monitoredCompetition.chooseIntoSubmenu(
      'team',
      this.templates.team,
      {
        choices: async (ctx) => {
          const competition = ctx.session.selectedCompetition;
          const teams = await firstValueFrom(
            this.monitoringService.getMonitoredTeams(competition),
          );
          return teams.reduce<Record<string, string>>((acc, team) => {
            acc[team.id.toString()] = team.name;
            return acc;
          }, {});
        },
        columns: 2,
        getCurrentPage: async (ctx) => ctx.session.page,
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.monitoredCompetition.manualRow(
      createBackMainMenuButtons(
        this.formattingService.backButtonText(),
        this.formattingService.homeButtonText(),
      ),
    );
  }

  async onModuleInit() {
    this.bot.use(
      session({
        initial: initialSession,
        storage: new RedisAdapter<SessionData>({ instance: this.redis }),
        getSessionKey,
      }),
    );

    this.buildTemplates();

    const middleware = new MenuMiddleware<MyCtx>('/', this.templates.main);
    this.bot.command('start', (ctx) => middleware.replyToContext(ctx));

    this.setupSessionTransformation();

    this.bot.use(middleware);

    this.bot.catch((err) => {
      this.logger.error('🤖 Telegram Bot Error', err);
    });

    this.bot.start();
  }

  private setupSessionTransformation(): void {
    this.bot.use(async (ctx, next) => {
      if (ctx.session?.selectedCompetition) {
        ctx.session.selectedCompetition = plainToInstance(
          Competition,
          ctx.session.selectedCompetition,
        );
      }
      if (ctx.session?.selectedTeam) {
        ctx.session.selectedTeam = plainToInstance(
          Team,
          ctx.session.selectedTeam,
        );
      }
      await next();
    });
  }
}
