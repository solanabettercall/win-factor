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

interface IAppConfig {
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isLocal: boolean;
  proxy?: IProxy;
  redis: IRedisConfig;
}

export const appConfig = (): IAppConfig => {
  const rawEnv = process.env.NODE_ENV?.toLowerCase() ?? Environment.production;
  const env = validEnvs.includes(rawEnv as Environment)
    ? (rawEnv as Environment)
    : Environment.production;
  let proxy: IProxy = null;
  const proxyHost = process.env.PROXY_HOST;
  const proxyPort = parseInt(process.env.PROXY_PORT, 10);
  if (proxyHost && proxyPort) {
    proxy = {
      host: proxyHost,
      port: proxyPort,
    };
  }

  return {
    env,
    isProduction: env === Environment.production,
    isDevelopment: env === Environment.development,
    isLocal: env === Environment.local,
    proxy,
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    },
  };
};

export type AppConfig = ReturnType<typeof appConfig>;
