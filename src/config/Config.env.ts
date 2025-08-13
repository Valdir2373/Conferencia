import dotenv from "dotenv";

dotenv.config();

export class ConfigEnv {
  ambientVariableDatabase() {
    return process.env.MONGO_URL;
  }

  ambientVariableJWT() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      jwtTimeSetSecret: process.env.JWT_TIME_SET_SECRET,
    };
  }

  public get(key: string): string {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Variável de ambiente ${key} não está definida.`);
    }
    return value;
  }
}
