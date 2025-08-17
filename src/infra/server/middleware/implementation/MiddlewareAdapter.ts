import { HttpMethods, IServer } from "../../http/interface/IServer";
import { IMiddlewareManagerRoutes } from "../interfaces/IMiddlewareManagerRoutes";
import { IMiddlewareHandler } from "../interfaces/IMiddlewareHandler";
import { IAuthUser } from "../../../security/auth/IAuthUser";
import { IAuthTokenManager } from "../../../security/tokens/IAuthTokenManager";
import { IRequest } from "../interfaces/IRequest";
import { IResponse } from "../interfaces/IResponse";
import { IJwtUser } from "../../../security/tokens/IJwtUser";
import { UserOutputDTO } from "../../../../application/users/DTO/UserOutput";
import { UsersService } from "../../../service/UsersService";
import { ErrorReply } from "redis";

export class MiddlewareAdapter implements IMiddlewareManagerRoutes {
  private isProduction = process.env.NODE_ENV === "production";
  constructor(
    private server: IServer,
    private authTokenManager: IAuthTokenManager,
    private usersService: UsersService
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
  ) {
    const authenticationAndHandlerWrapper = async (
      req: IRequest,
      res: IResponse,
      next: () => void
    ) => {
      let nextCalled = false;
      const safeNext = () => {
        nextCalled = true;
      };

      await this.authenticationMiddleware(req, res, safeNext);

      if (res.headersSent) {
        return;
      }

      if (!nextCalled) {
        return;
      }

      for (const handler of handlers) {
        if (res.headersSent) {
          return;
        }
        await handler(req, res, () => {});
      }
    };

    this.server.registerRouter(
      methodHTTP,
      path,
      authenticationAndHandlerWrapper
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
        req.userPayload = await this.getUserByCookieAndRefreshToken(req, res);

        await this.authenticationOfPassword(req, res, next);
      },
      ...handlers
    );
  }

  registerRouterToAdminWithTwoFactors(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    this.registerRouterToAdmin(
      methodHTTP,
      path,
      async (req, res, next) => {
        req.userPayload = await this.getUserByCookieAndRefreshToken(req, res);
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

      const verificationOfPassword = await this.usersService.loginUserService({
        useremail: email,
        userpassword: password,
      });

      if (!verificationOfPassword)
        return res.status(401).json({ message: "Senha incorreta" });

      next();
    } catch (error: any) {
      console.error(error);

      return res.status(500).json({ message: "Ocorreu um erro interno" });
    }
  };
  private authenticationMiddleware: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const user = await this.getUserByCookieAndRefreshToken(req, res);
      req.userPayload = user;
      return next();
    } catch (error: any) {
      if (
        res.headersSent &&
        error.message === "cookies faltando na requisição"
      ) {
        return;
      }
      return res.status(401).json({ message: "unauthorized" });
    }
  };
  private authenticationFromIdTokenToCreate: IMiddlewareHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const result = await this.authTokenManager.verifyTokenTimerSet(
        req.params.idToken
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
      const user = await this.getUserByCookieAndRefreshToken(req, res);
      req.userPayload = user;
      const admin = await this.usersService.verifyIfUserAdminByEmail(
        user.email
      );
      if (admin) next();
    } catch (error: any) {
      if (
        (res.headersSent &&
          error.message === "cookies faltando na requisição") ||
        error.message === "user not admin" ||
        error.message === "usuario não autorizado"
      ) {
        return;
      }
    }
  };
  private async getUserByCookieAndRefreshToken(
    req: IRequest,
    res: IResponse
  ): Promise<IJwtUser> {
    const tokenAcess = req.cookies?.tokenAcess;
    const refreshToken = req.cookies?.refreshToken;

    if (!req.cookies || !tokenAcess || !refreshToken) {
      res.status(401).json({ message: "No cookie" });
      throw new Error("cookies faltando na requisição");
    }

    const tokenAcessVerify = await this.authTokenManager.verifyToken(
      tokenAcess
    );
    const refreshTokenVerify = await this.authTokenManager.verifyRefreshToken(
      refreshToken
    );

    if (refreshTokenVerify.status) {
      if (tokenAcessVerify.status) {
        return tokenAcessVerify.jwt;
      } else {
        const userOutput = await this.usersService.getByIdUser(
          refreshTokenVerify.jwt.id
        );
        if (!userOutput) {
          throw new Error("user not found");
        }
        await this.cookieDefinerUser(res, userOutput, refreshToken);
        return refreshTokenVerify.jwt;
      }
    } else {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("unauthorized");
    }
  }

  private async cookieDefinerUser(
    res: IResponse,
    userOutput: UserOutputDTO,
    refreshToken: string
  ): Promise<void> {
    res.clearCookie("refreshToken");
    res.clearCookie("tokenAcess");
    await this.authTokenManager.revokeRefreshToken(refreshToken);

    res.cookie(
      "refreshToken",
      this.authTokenManager.generateRefreshToken(userOutput),
      {
        httpOnly: true,
        secure: this.isProduction,
        maxAge: 12 * 24 * 60 * 60 * 1000,
        sameSite: this.isProduction ? "none" : "lax",
        path: "/",
      }
    );
    res.cookie("tokenAcess", this.authTokenManager.generateToken(userOutput), {
      httpOnly: true,
      secure: this.isProduction,
      maxAge: 16 * 60 * 1000,
      sameSite: this.isProduction ? "none" : "lax",
      path: "/",
    });
  }
}
