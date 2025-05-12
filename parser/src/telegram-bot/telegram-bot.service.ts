import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { RedisAdapter } from '@grammyjs/storage-redis';
import Redis from 'ioredis';
import {
  createBackMainMenuButtons,
  MenuMiddleware,
  MenuTemplate,
} from 'grammy-inline-menu';
import { firstValueFrom, of } from 'rxjs';
import { appConfig } from 'src/config/parser.config';
import { PlayerService } from 'src/monitoring/player.service';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { plainToInstance } from 'class-transformer';

interface SessionData {
  page: number;
  selectedCompetition?: Competition;
  selectedTeam?: Team;
}

type MyCtx = Context & SessionFlavor<SessionData>;

// type MyCtx = Context & { session: SessionData };

function getSessionKey(ctx: Context): string | undefined {
  // Let all users in a group chat share the same session,
  // but give an independent private one to each user in private chats
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

  constructor(private readonly playerService: PlayerService) {
    const { telegram, redis } = appConfig();
    this.bot = new Bot<MyCtx>(telegram.botToken);
    this.redis = new Redis(redis);
  }

  private readonly templates: Record<MenuTemplateType, MenuTemplate<MyCtx>> = {
    allCompetitions: new MenuTemplate<MyCtx>(async (ctx) => {
      return `Выбери соревнование`;
    }),
    competition: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = parseInt(ctx.match[1]);
      this.logger.verbose('Отрисовали список турниров');

      const selectedCompetition = await firstValueFrom(
        this.playerService.getCompetitionById(id),
      );

      ctx.session.selectedCompetition = selectedCompetition;
      return `Выбран турнир ${ctx.session.selectedCompetition.name}`;
    }),
    main: new MenuTemplate<MyCtx>(async (ctx) => {
      return `Выбери один из вариантов`;
    }),
    team: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = ctx.match[2];
      const selectedTeam = await firstValueFrom(
        this.playerService.getTeamById(ctx.session.selectedCompetition, id),
      );
      ctx.session.selectedTeam = selectedTeam;

      return `Выбрана команда ${ctx.session.selectedTeam.name}`;
    }),
    monitoredCompetitions: new MenuTemplate<MyCtx>(async (ctx) => {
      return `Выбери соревнование в мониторинге`;
    }),
    monitoredCompetition: new MenuTemplate<MyCtx>(async (ctx) => {
      const id = parseInt(ctx.match[1]);
      this.logger.verbose('Отрисовали список турниров в мониторинге');

      const selectedCompetition = await firstValueFrom(
        this.playerService.getCompetitionById(id),
      );

      ctx.session.selectedCompetition = selectedCompetition;
      return `Выбран турнир ${ctx.session.selectedCompetition.name}`;
    }),
  };

  private buildTemplates() {
    this.templates.main.submenu('ac', this.templates.allCompetitions, {
      text: 'Все игроки',
    });
    this.templates.main.submenu('mcs', this.templates.monitoredCompetitions, {
      text: 'Текущий мониторинг',
    });

    this.templates.team.select('player', {
      choices: async (ctx) => {
        const competition = ctx.session.selectedCompetition;
        const team = ctx.session.selectedTeam;
        const teamRoster = await firstValueFrom(
          this.playerService.getTeam({ competition, teamId: team.id }),
        );

        return (
          teamRoster.players
            // .sort((a, b) => a.id - b.id)
            .reduce<Record<string, string>>((acc, player) => {
              acc[player.id.toString()] = player.name;
              return acc;
            }, {})
        );
      },
      isSet: async (ctx, key) => {
        const playerId = parseInt(key);
        const isSelected = await firstValueFrom(
          this.playerService.isPlayerMonitored({
            tournamentId: ctx.session.selectedCompetition.id,
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
            this.playerService.addToMonitoring({
              playerId,
              tournamentId: ctx.session.selectedCompetition.id,
              teamId: ctx.session.selectedTeam.id,
            }),
          );
        } else {
          await firstValueFrom(
            this.playerService.removeFromMonitoring({
              playerId,
              tournamentId: ctx.session.selectedCompetition.id,
              teamId: ctx.session.selectedTeam.id,
            }),
          );
        }

        return true;
      },
      columns: 2,
      getCurrentPage: async (ctx) => {
        const page = ctx.session.page;
        console.log(page);
        return page;
      },
      setPage: (ctx, pg) => {
        ctx.session.page = pg;
      },
      showFalseEmoji: true,
    });
    this.templates.team.manualRow(createBackMainMenuButtons('Назад', 'Меню'));

    this.templates.competition.chooseIntoSubmenu('team', this.templates.team, {
      choices: async (ctx) => {
        const competition = ctx.session.selectedCompetition;
        const teams = await firstValueFrom(
          this.playerService.getTeams(competition),
        );
        return teams.reduce<Record<string, string>>((acc, team) => {
          acc[team.id.toString()] = team.name;
          return acc;
        }, {});
      },
      columns: 2,
      getCurrentPage: async (ctx) => {
        const page = ctx.session.page;
        console.log(page);
        return page;
      },
      setPage: (ctx, pg) => {
        ctx.session.page = pg;
      },
    });
    this.templates.competition.manualRow(
      createBackMainMenuButtons('Назад', 'Меню'),
    );

    this.templates.allCompetitions.chooseIntoSubmenu(
      'competition',
      this.templates.competition,
      {
        choices: async () => {
          const competitions = await firstValueFrom(
            this.playerService.getCompetitions(),
          );
          return (
            competitions
              // .sort((a, b) => a.id - b.id)
              .reduce<Record<string, string>>((acc, competition) => {
                acc[competition.id.toString()] = competition.name;
                return acc;
              }, {})
          );
        },
        columns: 2,
        getCurrentPage: async (ctx) => {
          const page = ctx.session.page;
          return page;
        },
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.allCompetitions.manualRow(
      createBackMainMenuButtons('Назад', 'Меню'),
    );

    this.templates.monitoredCompetitions.chooseIntoSubmenu(
      'competition',
      this.templates.monitoredCompetition,
      {
        choices: async () => {
          const competitions = await firstValueFrom(
            this.playerService.getMonitoredCompetitions(),
          );
          return (
            competitions
              // .sort((a, b) => a.id - b.id)
              .reduce<Record<string, string>>((acc, competition) => {
                acc[competition.id.toString()] = competition.name;
                return acc;
              }, {})
          );
        },
        columns: 2,
        getCurrentPage: async (ctx) => {
          const page = ctx.session.page;
          return page;
        },
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.monitoredCompetitions.manualRow(
      createBackMainMenuButtons('Назад', 'Меню'),
    );

    this.templates.monitoredCompetition.chooseIntoSubmenu(
      'team',
      this.templates.team,
      {
        choices: async (ctx) => {
          const competition = ctx.session.selectedCompetition;
          const teams = await firstValueFrom(
            this.playerService.getMonitoredTeams(competition),
          );
          return teams.reduce<Record<string, string>>((acc, team) => {
            acc[team.id.toString()] = team.name;
            return acc;
          }, {});
        },
        columns: 2,
        getCurrentPage: async (ctx) => {
          const page = ctx.session.page;
          console.log(page);
          return page;
        },
        setPage: (ctx, pg) => {
          ctx.session.page = pg;
        },
      },
    );
    this.templates.monitoredCompetition.manualRow(
      createBackMainMenuButtons('Назад', 'Меню'),
    );
  }

  async onModuleInit() {
    this.bot.use(
      session({
        initial: initialSession,
        storage: new RedisAdapter<SessionData>({ instance: this.redis }),
        getSessionKey: getSessionKey,
      }),
    );

    this.buildTemplates();

    const middleware = new MenuMiddleware<MyCtx>('/', this.templates.main);
    this.bot.command('start', (ctx) => {
      return middleware.replyToContext(ctx);
    });

    this.setupSessionTransformation();

    this.bot.use(middleware);

    await this.bot.start();
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
