import { config } from 'dotenv';

config();

export enum Environment {
  local = 'local',
  development = 'development',
  production = 'production',
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
}

export const appConfig = (): IAppConfig => {
  const rawEnv = process.env.NODE_ENV?.toLowerCase() ?? Environment.production;
  const env = validEnvs.includes(rawEnv as Environment)
    ? (rawEnv as Environment)
    : Environment.production;

  return {
    env,
    isProduction: env === Environment.production,
    isDevelopment: env === Environment.development,
    isLocal: env === Environment.local,
  };
};

export type AppConfig = ReturnType<typeof appConfig>;
