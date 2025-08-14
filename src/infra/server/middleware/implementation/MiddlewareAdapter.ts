import { HttpMethods, IServer } from "../../http/interface/IServer";
import { IMiddlewareManagerRoutes } from "../interfaces/IMiddlewareManagerRoutes";
import { IMiddlewareHandler } from "../interfaces/IMiddlewareHandler";
import { IAuthUser } from "../../../security/tokens/IAuthUser";
import { IAuthTokenManager } from "../../../security/tokens/IAuthTokenManager";
import { IRequest } from "../interfaces/IRequest";
import { IResponse } from "../interfaces/IResponse";
import { IJwtUser } from "../../../interfaces/IJwtUser";

export class MiddlewareAdapter implements IMiddlewareManagerRoutes {
  constructor(
    private server: IServer,
    private authUser: IAuthUser,
    private authTokenManager: IAuthTokenManager
  ) {}

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

  registerRouterToUserWithTwoFactors(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.server.registerRouter(
      methodHTTP,
      path,
      // this.authenticationMiddleware.bind(this),
      // this.authenticationOfPassword.bind(this),
      async (req, res, next) => {
        const user = await this.getUserByCookie(req, res);

        req.userPayload = user;
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

      console.log();
      console.log();
      console.log(req.userPayload); // undefined

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

      console.log();
      console.log(user);
      console.log();

      req.userPayload = user;

      next();
    } catch (error: any) {
      return res.status(401).json({ message: "unauthorized" });
    }
  };

  private async getUserByCookie(
    req: IRequest,
    res: IResponse
  ): Promise<IJwtUser> {
    if (!req.cookies || !req.cookies.tokenAcess) {
      res.status(401).json({ message: "No cookie" });
      throw new Error("cookies faltando na requisição");
    }
    const { jwt, status } = this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );
    if (!status) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("usuario não autorizado");
    }
    return jwt;
  }
}
