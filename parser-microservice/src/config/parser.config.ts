import { config } from 'dotenv';

config();

export enum Environment {
  local = 'local',
  development = 'development',
  production = 'production',
}

interface IProxySettings {
  host: string;
  port: number;
}

interface IAppConfig {
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isLocal: boolean;

  proxy?: IProxySettings;
}

let cachedConfig: IAppConfig | null = null;

export const appConfig = (): IAppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawEnv = process.env.NODE_ENV?.toLowerCase() ?? Environment.production;
  const env = [
    Environment.production,
    Environment.development,
    Environment.local,
  ].includes(rawEnv as Environment)
    ? (rawEnv as Environment)
    : Environment.production;

  const proxy: IProxySettings | null =
    process.env.PROXY_HOST && process.env.PROXY_PORT
      ? {
          host: process.env.PROXY_HOST,
          port: parseInt(process.env.PROXY_PORT, 10),
        }
      : null;

  cachedConfig = {
    env,
    isProduction: env === Environment.production,
    isDevelopment: env === Environment.development,
    isLocal: env === Environment.local,
    proxy,
  };

  return cachedConfig;
};

export type AppConfig = ReturnType<typeof appConfig>;
