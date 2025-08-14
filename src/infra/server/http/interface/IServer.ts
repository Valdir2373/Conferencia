import { IMiddlewareHandler } from "../../middleware/interfaces/IMiddlewareHandler";
import { Server } from "http";

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
    ...handlers: IMiddlewareHandler[]
  ): Promise<void>;

  registerFileUploadRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;

  eachRequestToAllRoutes(...handlers: IMiddlewareHandler[]): void;

  listen(port: number, callback?: () => void): Server;
  getHttpServer(): Server;
}
