import { IAuthTokenManager } from "../../security/tokens/IAuthTokenManager";
import { MiddlewareHandler } from "./IMiddlewareHandler";
import { Server } from "http";
import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";

export type HttpMethods =
  | "post"
  | "get"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head";

export interface IServer {
  registerRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: MiddlewareHandler[]
  ): void;

  registerFileUploadRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: MiddlewareHandler[]
  ): void;

  eachRequestToAllRoutes(...handlers: MiddlewareHandler[]): void;

  listen(port: number, callback?: () => void): Server;
  getHttpServer(): Server;
}
