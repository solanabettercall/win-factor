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
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';
import { plainToInstance } from 'class-transformer';
import { FormattingService } from './formating.service';
import { CompetitionService } from 'src/monitoring/competition.service';
import { MonitoringService } from 'src/monitoring/monitoring.service';
import { Team } from 'src/monitoring/schemas/team.schema';
import { PlayerService } from 'src/monitoring/player.service';

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
    private readonly playerService: PlayerService,
    private readonly formattingService: FormattingService,
  ) {
    const { telegram, redis } = appConfig();
    this.bot = new Bot<MyCtx>(telegram.botToken);
    this.redis = new Redis(redis);
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

        return teamRoster.players.reduce<Record<string, string>>(
          (acc, player) => {
            acc[player.id.toString()] = player.name;
            return acc;
          },
          {},
        );
      },
      isSet: async (ctx, key) => {
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
      columns: 2,
      getCurrentPage: async (ctx) => ctx.session.page,
      setPage: (ctx, pg) => {
        ctx.session.page = pg;
      },
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
