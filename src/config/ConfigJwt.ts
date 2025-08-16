import { ConfigEnv } from "./Config.env";

export class ConfigJwt {
  configEnv: ConfigEnv;
  constructor() {
    this.configEnv = new ConfigEnv();
  }
  ambientVariablesJWTConfig() {
    return this.configEnv.ambientVariableJWT();
  }
}
