import { IAuthTokenManager, TokenGenerationOptions } from "./IAuthTokenManager";
import jwt, { SignOptions } from "jsonwebtoken";
import { ConfigJwt } from "../../../config/ConfigJwt";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "redis";

export class JsonwebtokenAuthTokenManager implements IAuthTokenManager {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly redisUrl: string;
  private readonly jwtTimeSetSecret: string;
  private readonly accessTokenExpiresIn: string | number;
  private readonly refreshTokenExpiresIn: string | number;
  private readonly redisClient: any;

  constructor(
    accessTokenExpiresIn: string | number = "15m",
    refreshTokenExpiresIn: string | number = "7d"
  ) {
    const configJwt = new ConfigJwt();

    const { jwtSecret, jwtRefreshSecret, jwtTimeSetSecret, redisUrl } =
      configJwt.ambientVariablesJWTConfig();

    if (!jwtSecret || !jwtRefreshSecret || !jwtTimeSetSecret || !redisUrl) {
      throw new Error(
        "JWT secrets must be provided. Check your environment variables."
      );
    }
    this.redisUrl = redisUrl;
    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.jwtTimeSetSecret = jwtTimeSetSecret;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
    this.redisClient = this.createClientRedis();
  }

  private createClientRedis() {
    const redisClient = createClient({
      url: this.redisUrl,
    });
    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    redisClient.connect();
    return redisClient;
  }

  private buildSignOptions(
    baseExpiresIn: string | number,
    options?: TokenGenerationOptions
  ): jwt.SignOptions {
    const signOptions: jwt.SignOptions = {
      expiresIn: (options?.expiresIn ??
        baseExpiresIn) as SignOptions["expiresIn"],
      jwtid: options?.jwtid ?? uuidv4(), // Adiciona um JWT ID único por padrão
    };

    if (typeof options?.issuer === "string") {
      signOptions.issuer = options.issuer;
    }
    if (typeof options?.subject === "string") {
      signOptions.subject = options.subject;
    }
    if (
      typeof options?.notBefore === "string" ||
      typeof options?.notBefore === "number"
    ) {
      signOptions.notBefore = options.notBefore as SignOptions["notBefore"];
    }
    if (
      typeof options?.audience === "string" ||
      Array.isArray(options?.audience)
    ) {
      signOptions.audience = options.audience;
    }

    return signOptions;
  }

  public generateToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(
      this.accessTokenExpiresIn,
      options
    );
    return jwt.sign(payload, this.jwtSecret, signOptions);
  }

  public generateRefreshToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(
      this.refreshTokenExpiresIn,
      options
    );
    return jwt.sign(payload, this.jwtRefreshSecret, signOptions);
  }

  public generateTokenTimerSet(
    payload: object,
    expiresIn: string | number,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(expiresIn, options);
    return jwt.sign(payload, this.jwtTimeSetSecret, signOptions);
  }

  private async verifyAndHandleErrors<T extends object>(
    token: string,
    secret: string
  ): Promise<T> {
    try {
      const decoded = jwt.decode(token);

      if (typeof decoded === "object" && decoded !== null && decoded.jti) {
        const isRevoked = await this.redisClient.exists(decoded.jti);

        if (isRevoked) {
          return { message: "Token revogado.", status: false } as T;
        }
      }

      const jsonWebTkn = {
        jwt: jwt.verify(token, secret) as T,
        status: true,
      } as T;

      return jsonWebTkn;
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        return { message: "Token expirado.", status: false } as T;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { message: "Token inválido ou malformado.", status: false } as T;
      }
      throw error;
    }
  }

  public async verifyToken<T extends object>(token: string): Promise<T> {
    return await this.verifyAndHandleErrors(token, this.jwtSecret);
  }

  public async verifyRefreshToken<T extends object>(token: string): Promise<T> {
    return await this.verifyAndHandleErrors(token, this.jwtRefreshSecret);
  }

  public async verifyTokenTimerSet<T extends object>(
    token: string
  ): Promise<T> {
    return await this.verifyAndHandleErrors(token, this.jwtTimeSetSecret);
  }

  public async revokeToken(token: string): Promise<void> {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && decoded.jti && decoded.exp) {
      const expiration = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiration > 0) {
        await this.redisClient.set(decoded.jti, "revoked", { EX: expiration });
      }
    }
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && decoded.jti && decoded.exp) {
      const expiration = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiration > 0) {
        await this.redisClient.set(decoded.jti, "revoked", { EX: expiration });
      }
    }
  }

  public async revokeTokenTimerSet(token: string): Promise<void> {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && decoded.jti && decoded.exp) {
      const expiration = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiration > 0) {
        await this.redisClient.set(decoded.jti, "revoked", { EX: expiration });
      }
    }
  }

  public decodeToken<T extends object>(token: string): T | null {
    return jwt.decode(token) as T | null;
  }
}
