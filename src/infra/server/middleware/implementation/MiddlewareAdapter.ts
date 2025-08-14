import { HttpMethods, IServer } from "../../http/interface/IServer";
import { IMiddlewareManagerRoutes } from "../interfaces/IMiddlewareManagerRoutes";
import { IMiddlewareHandler } from "../interfaces/IMiddlewareHandler";
import { IAuthUser } from "../../../security/interfaces/IAuthUser";
import { IAuthTokenManager } from "../../../security/interfaces/IAuthTokenManager";
import { IRequest } from "../interfaces/IRequest";
import { IResponse } from "../interfaces/IResponse";
import { IJwtUser } from "../../../security/interfaces/IJwtUser";

export class MiddlewareAdapter implements IMiddlewareManagerRoutes {
  constructor(
    private server: IServer,
    private authUser: IAuthUser,
    private authTokenManager: IAuthTokenManager
  ) {}
  registerRouterToAdmin(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(
      methodHTTP,
      path,

      async (req, res, next) => {
        this.authenticationToAdmin(req, res, next);
      },
      ...handlers
    );
  }
  registerRouterToCreateUser(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(
      methodHTTP,
      path,
      async (req, res, next) => {
        this.authenticationFromIdTokenToCreate.bind(this);
      },
      ...handlers
    );
  }

  registerRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(methodHTTP, path, ...handlers);
  }

  registerFileUploadRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerFileUploadRouter(methodHTTP, path, ...handlers);
  }

  registerRouterToUser(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(
      methodHTTP,
      path,
      this.authenticationMiddleware.bind(this),
      ...handlers
    );
  }

  registerRouterAuthenticTokenToCreate(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ) {
    this.server.registerRouter(
      methodHTTP,
      path,
      this.authenticationFromIdTokenToCreate.bind(this),
      ...handlers
    );
  }

  registerRouterToUserWithTwoFactors(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(
      methodHTTP,
      path,

      async (req, res, next) => {
        req.userPayload = await this.getUserByCookie(req, res);

        await this.authenticationOfPassword(req, res, next);
      },
      ...handlers
    );
  }

  private authenticationOfPassword: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const email = req.userPayload?.email;
      const password = req.body.password;
      if (!email || !password)
        return res.status(400).json({ message: "Email ou senha faltando" });

      const verificationOfPassword =
        await this.authUser.verifyPasswordFromUserByEmail(email, password);

      if (!verificationOfPassword)
        return res.status(401).json({ message: "access denied" });

      next();
    } catch (error: any) {
      return res.status(500).json({ message: "Ocorreu um erro interno" });
    }
  };

  private authenticationMiddleware: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const user = await this.getUserByCookie(req, res);
      req.userPayload = user;

      next();
    } catch (error: any) {
      return res.status(401).json({ message: "unauthorized" });
    }
  };

  private authenticationFromIdTokenToCreate: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const idTokenCreate = req.params.idTokenCreate;
      const result = await this.authTokenManager.verifyTokenTimerSet(
        idTokenCreate
      );
      if (result.status) return next();

      throw new Error("token invalid");
    } catch (error: any) {
      return res.status(401).json({ message: "unauthorized" });
    }
  };

  private authenticationToAdmin: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const user = await this.getUserByCookie(req, res);
      req.userPayload = user;
      console.log(user);

      const admin = await this.authUser.verifyUserAdminByEmail(user.email);
      if (admin) next();
      return res.status(401).json({ message: "unauthorized" });
    } catch (error: any) {}
  };

  private async getUserByCookie(
    req: IRequest,
    res: IResponse
  ): Promise<IJwtUser> {
    if (!req.cookies || !req.cookies.tokenAcess) {
      res.status(401).json({ message: "No cookie" });
      throw new Error("cookies faltando na requisição");
    }
    const result = await this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );
    if (!result.status) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("usuario não autorizado");
    }
    return result.jwt;
  }
}
