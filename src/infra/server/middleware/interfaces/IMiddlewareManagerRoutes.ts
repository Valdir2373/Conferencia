import { IMiddlewareHandler } from "./IMiddlewareHandler";
import { HttpMethods } from "../../http/interface/IServer";

export interface IMiddlewareManagerRoutes {
  registerRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerFileUploadRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerRouterToUser(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerRouterToUserWithTwoFactors(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerRouterAuthenticTokenToCreate(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerRouterToCreateUser(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
  registerRouterToAdmin(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void;
}
