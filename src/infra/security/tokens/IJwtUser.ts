export interface IJwtUser {
  username: string;
  email: string;
  id: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface IJwtUserToVerify {
  email: string;
  status: boolean;
  iat: number;
  exp: number;
  jti: string;
}
