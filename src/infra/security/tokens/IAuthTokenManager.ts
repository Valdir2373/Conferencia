import { IJwtUser, IJwtUserToVerify } from "./IJwtUser";

// interfaces/IAuthTokenManager.ts
export interface TokenGenerationOptions {
  expiresIn?: string | number;
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  jwtid?: string;
  notBefore?: string | number;
}
interface ITokenVerifiedSuccess {
  status: true;
  jwt: IJwtUser;
}
interface ITokenVerifiedFailure {
  status: false;
  message: string;
}

interface ITokenVerifiedSuccessEmailToVerify {
  status: true;
  jwt: IJwtUserToVerify;
}
interface ITokenVerifiedFailureEmailToVerify {
  status: false;
  message: IJwtUserToVerify;
}

export type ITokenVerified = ITokenVerifiedSuccess | ITokenVerifiedFailure;
export type ITokenVerifiedEmailToVerify =
  | ITokenVerifiedSuccessEmailToVerify
  | ITokenVerifiedFailureEmailToVerify;

export interface IAuthTokenManager {
  generateToken(payload: object, options?: TokenGenerationOptions): string;
  generateRefreshToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string;
  generateTokenTimerSet(
    payload: object,
    expiresIn: string | number,
    options?: TokenGenerationOptions
  ): string;
  verifyTokenTimerSet<T extends object>(token: string): Promise<T>;
  verifyToken<T extends object>(token: string): Promise<ITokenVerified>;
  verifyRefreshToken<T extends object>(
    token: string
  ): Promise<T | ITokenVerified>;
  decodeToken<T extends object>(token: string): T | null;
  revokeToken(token: string): Promise<void>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeTokenTimerSet(token: string): Promise<void>;
}
