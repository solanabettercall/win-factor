import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { RedisAdapter } from '@grammyjs/storage-redis';
import Redis from 'ioredis';
import { MenuMiddleware, MenuTemplate } from 'grammy-inline-menu';
import { firstValueFrom, of } from 'rxjs';
import { appConfig } from 'src/config/parser.config';
import { PlayerService } from 'src/monitoring/player.service';
import { Competition } from 'src/parser/sites/volleystation/models/vollestation-competition';

interface SessionData {
  page: number;
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

    menu.choose('unique', {
      choices: async () => {
        const comps = await this.fetchCompetitions();
        return comps.map((c) => c.id.toString());
      },
      do: async (ctx, key) => {
        const comps = await this.fetchCompetitions();
        const comp = comps.find((c) => c.id.toString() === key);
        if (comp) {
          await ctx.answerCallbackQuery();
          await ctx.reply(`Вы выбрали: ${comp.name} (ID ${comp.id})`);
        }
        return false;
      },
      buttonText: async (_, key) => {
        const comps = await this.fetchCompetitions();
        return comps.find((c) => c.id.toString() === key)?.name ?? key;
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

    const middleware = new MenuMiddleware<MyCtx>('/', menu);
    this.bot.command('start', (ctx) => {
      // ctx.session.page = 1;
      return middleware.replyToContext(ctx);
    });
    this.bot.use(middleware);
    this.bot.use(async (ctx, next) => {
      console.log('User ID:', ctx.from?.id);
      await next();
    });
    await this.bot.start();
  }

  private fetchCompetitions(): Promise<Competition[]> {
    // return firstValueFrom(of([]));
    return firstValueFrom(this.playerService.getCompetitions());
  }
}
