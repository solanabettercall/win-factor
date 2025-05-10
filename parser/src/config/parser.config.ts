import { config } from 'dotenv';

config();

export enum Environment {
  local = 'local',
  development = 'development',
  production = 'production',
}

export interface IProxy {
  host: string;
  port: number;
}

export interface IRedisConfig {
  host: string;
  port: number;
}

const validEnvs: Environment[] = [
  Environment.local,
  Environment.development,
  Environment.production,
];
export interface IMongodbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}
export interface ITelegramConfig {
  botToken: string;
}

interface IAppConfig {
  port: number;
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isLocal: boolean;
  proxy?: IProxy;
  redis: IRedisConfig;
  mongodb: IMongodbConfig;
  telegram: ITelegramConfig;
}

export const appConfig = (): IAppConfig => {
  const rawEnv =
    process.env.PARSER_NODE_ENV?.toLowerCase() ?? Environment.production;
  const env = validEnvs.includes(rawEnv as Environment)
    ? (rawEnv as Environment)
    : Environment.production;
  let proxy: IProxy = null;
  const proxyHost = process.env.PARSER_PROXY_HOST;
  const proxyPort = parseInt(process.env.PARSER_PROXY_PORT, 10);
  if (proxyHost && proxyPort) {
    proxy = {
      host: proxyHost,
      port: proxyPort,
    };
  }

  const config: IAppConfig = {
    port: parseInt(process.env.PARSER_HEALTHCHECK_PORT, 10) || 3001,
    env,
    isProduction: env === Environment.production,
    isDevelopment: env === Environment.development,
    isLocal: env === Environment.local,
    proxy,
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    },
    mongodb: {
      host: process.env.MONGODB_HOST,
      port: parseInt(process.env.MONGODB_POPT, 10),
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD,
      database: process.env.MONGODB_DATABASE ?? 'monitoring',
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
    },
  };

  return config;
};

export type AppConfig = ReturnType<typeof appConfig>;
