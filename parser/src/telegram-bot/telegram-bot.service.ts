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

const initialSession = (): SessionData => ({ page: 1 });

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

  async onModuleInit() {
    this.bot.use(
      session({
        initial: initialSession,
        storage: new RedisAdapter<SessionData>({ instance: this.redis }),
        getSessionKey: getSessionKey,
      }),
    );

    const menu = new MenuTemplate<MyCtx>(async (ctx) => {
      return `Выбери соревнование`;
    });

    const competitionMenu = new MenuTemplate<MyCtx>(async (ctx) => {
      const id = parseInt(ctx.match[1]);
      this.logger.verbose('Отрисовали список турниров');

      const selectedCompetition = await firstValueFrom(
        this.playerService.getCompetitionById(id),
      );

      ctx.session.selectedCompetition = selectedCompetition;
      return `Выбран турнир ${ctx.session.selectedCompetition.name}`;
    });

    const teamMenu = new MenuTemplate<MyCtx>(async (ctx) => {
      const id = ctx.match[2];
      const selectedTeam = await firstValueFrom(
        this.playerService.getTeamById(ctx.session.selectedCompetition, id),
      );
      ctx.session.selectedTeam = selectedTeam;

      return `Выбрана команда ${ctx.session.selectedTeam.name}`;
    });
    teamMenu.choose('unique', {
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
      do: async (ctx) => {
        console.log('Выбран игрок', ctx.match);
        await ctx.answerCallbackQuery('You hit a button in a submenu');
        return false;
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
    teamMenu.manualRow(createBackMainMenuButtons('Назад', 'Меню'));

    competitionMenu.chooseIntoSubmenu('unique', teamMenu, {
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
    competitionMenu.manualRow(createBackMainMenuButtons('Назад', 'Меню'));

    menu.chooseIntoSubmenu('unique', competitionMenu, {
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
    });

    const middleware = new MenuMiddleware<MyCtx>('/', menu);
    this.bot.command('start', (ctx) => {
      return middleware.replyToContext(ctx);
    });

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

    this.bot.use(middleware);

    await this.bot.start();
  }

  // private fetchCompetitions(): Promise<Competition[]> {
  //   // return firstValueFrom(of([]));
  //   return firstValueFrom(this.playerService.getCompetitions());
  // }

  // private fetchTeams(): Promise<Team[]> {
  //   return firstValueFrom(of([]));
  //   // return firstValueFrom(this.playerService.getTeams());
  // }
}
