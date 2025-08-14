import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { ValidationError } from "../../shared/error/ValidationError";
import { IDTOBuilderAndValidator } from "../../shared/validator/IFieldsValidator";
import { IEmailService } from "../interfaces/IEmailService";
import { IUserLogin } from "../interfaces/IUserLogin";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { IServer } from "../server/http/interface/IServer";
import { UsersService } from "../service/UsersService";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class AuthController {
  private schemasUserLogin: IDTOBuilderAndValidator<IUserLogin>;
  private schemasUserDto: IDTOBuilderAndValidator<UserInputDTO>;
  private isProduction = process.env.NODE_ENV === "production";

  constructor(
    private middlewareManagerRoutes: IMiddlewareManagerRoutes,
    private token: IAuthTokenManager,
    private usersService: UsersService,
    private emailService: IEmailService,
    private usersSchemas: UsersSchemas
  ) {
    this.schemasUserDto = this.usersSchemas.schemasUserDto;
    this.schemasUserLogin = this.usersSchemas.schemasUserLogin;
    this.mountRouters();
  }
  mountRouters() {
    this.middlewareManagerRoutes.registerRouterAuthenticTokenToCreate(
      "get",
      "/verify/:idTokenCreate",
      this.verifedWithSuccess.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "post",
      "/users/login",
      this.login.bind(this)
    );

    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/refreshToken",
      this.refreshToken.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/verifyUser",
      this.verifyUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/verifyEmail/:token",
      this.verifyEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/resend-verification/:email",
      this.resendVerification.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/loggout",
      this.loggoutUser.bind(this)
    );
  }

  private async verifedWithSuccess(req: IRequest, res: IResponse) {
    res.status(200).json({ message: "link autorizado." });
  }

  private async loggoutUser(req: IRequest, res: IResponse) {
    try {
      this.isProduction = process.env.NODE_ENV === "production";

      res.clearCookie("tokenAcess", {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: "none",
        path: "/",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: "none",
        path: "/",
      });

      return res.status(200).json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      return res
        .status(500)
        .json({ message: "Erro interno do servidor ao fazer logout" });
    }
  }

  private async verifyEmail(req: IRequest, res: IResponse) {
    const { token } = req.params;
    const response = await this.token.verifyTokenTimerSet(token);
    if (!response.status)
      return res.status(401).json({ message: "unauthorized" });
    const { email } = response.jwt;
    await this.usersService.authenticateUser(email);
    const userOutput = await this.usersService.getByEmailUser(email);
    if (!userOutput) return;
    this.cookieDefinerUser(res, userOutput);
    return res.redirect("http://localhost:5173/");
  }

  private async resendVerification(
    req: IRequest,
    res: IResponse
  ): Promise<any> {
    try {
      const { email } = req.params;
      const verified = await this.usersService.verifyUserByEmail(email);
      if (verified)
        return res.status(400).json({ message: "Email já verificado" });
      const userOutput = await this.usersService.getByEmailUser(email);
      if (!userOutput) return;
      await this.emailService.sendEmailVerificationUser(userOutput);
      return res.status(200).json({ message: "email sended" });
    } catch (e: any) {
      if (e.message === "user not found")
        return res.json({ message: "email sended" });
      console.error(e);
      return res.status(500).json({ message: "internal server error" });
    }
  }

  public async refreshToken(req: IRequest, res: IResponse) {
    try {
      const result = await this.verifyCookieToRefresh(req);

      if (!result || !result.status) {
        res.clearCookie("tokenAcess", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: this.isProduction ? "none" : "lax",
          path: "/",
        });
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: this.isProduction ? "none" : "lax",
          path: "/",
        });
        return res.status(401).json({
          message: "Refresh token inválido ou expirado. Faça login novamente.",
        });
      }

      const user = result.jwt;

      const userOutput: UserOutputDTO = {
        username: user.username,
        email: user.email,
        id: user.id,
      };

      console.log("Token of user refreshed: " + user.username);

      res.cookie("tokenAcess", this.token.generateToken(userOutput), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 16 * 60 * 1000,
        sameSite: this.isProduction ? "none" : "lax",
        path: "/",
      });

      return res.status(200).json({ message: "token enviado" });
    } catch (error) {
      console.error("Erro no refreshToken:", error);

      res.clearCookie("tokenAcess", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: this.isProduction ? "none" : "lax",
        path: "/",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: this.isProduction ? "none" : "lax",
        path: "/",
      });
      return res
        .status(500)
        .json({ message: "Erro interno do servidor ao atualizar token." });
    }
  }

  public async verifyUser(req: IRequest, res: IResponse) {
    const result = await this.verifyCookieToAcess(req);

    if (result && result.status) {
      return res.status(200).json({
        username: result.jwt.username,
        email: result.jwt.email,
        id: result.jwt.id,
      });
    } else {
      return res.status(401).json({ message: "Não autorizado." });
    }
  }

  async verifyCookieToRefresh(req: IRequest): Promise<any> {
    const cookie = req.cookies;
    if (!cookie || !cookie.refreshToken) {
      console.log(
        "verifyCookieToRefresh: refreshToken não encontrado ou sem cookies."
      );
      return { status: false, jwt: null };
    }

    const token = cookie.refreshToken;

    try {
      const result = await this.token.verifyRefreshToken(token);
      if (result.status) {
        console.log("verifyCookieToRefresh: refreshToken válido.");
        return result;
      } else {
        console.log(
          "verifyCookieToRefresh: refreshToken inválido ou expirado."
        );
        return { status: false, jwt: null };
      }
    } catch (error: any) {
      console.error(
        "verifyCookieToRefresh: Erro ao verificar refreshToken:",
        error.message
      );

      return { status: false, jwt: null };
    }
  }

  async verifyCookieToAcess(req: IRequest): Promise<any> {
    const cookie = req.cookies;

    if (!cookie || !cookie.tokenAcess) {
      console.log(
        "verifyCookieToAcess: tokenAcess não encontrado ou sem cookies."
      );
      return { status: false, jwt: null };
    }

    const tokenAcess = cookie.tokenAcess;
    try {
      const result = await this.token.verifyToken(tokenAcess);
      if (result.status) {
        console.log("verifyCookieToAcess: tokenAcess válido.");
        return result;
      } else {
        console.log("verifyCookieToAcess: tokenAcess inválido ou expirado.");
        return { status: false, jwt: null };
      }
    } catch (error: any) {
      console.error(
        "verifyCookieToAcess: Erro ao verificar tokenAcess:",
        error.message
      );

      return { status: false, jwt: null };
    }
  }

  private async login(req: IRequest, res: IResponse): Promise<void> {
    try {
      const inputData = req.body;

      if (!this.verifyInputUserLogin(inputData, res)) return;

      const userOutput = await this.usersService.loginUserService(inputData);

      if (!userOutput)
        return res.status(401).json({ message: "Access Denied" });

      this.cookieDefinerUser(res, userOutput);
      return res.status(200).json(userOutput);
    } catch (e: any) {
      if (e.message === "Erro de validação do DTO") {
        console.log(e.message + " tratado");
      }
    }
  }

  private verifyInputUserLogin(user: IUserLogin, res: IResponse): boolean {
    try {
      this.schemasUserLogin.validate(user);
      return true;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(401).json({ error: error.details });
        throw new Error(error.message);
      } else {
        console.error(
          "Um erro inesperado ocorreu na validação:",
          error.message
        );
        return false;
      }
    }
  }

  cookieDefinerUser(res: IResponse, userOutput: UserOutputDTO) {
    console.log(this.isProduction);

    res.cookie("refreshToken", this.token.generateRefreshToken(userOutput), {
      httpOnly: true,
      secure: this.isProduction,
      maxAge: 12 * 24 * 60 * 60 * 1000,
      sameSite: this.isProduction ? "none" : "lax",
      path: "/",
    });
    res.cookie("tokenAcess", this.token.generateToken(userOutput), {
      httpOnly: true,
      secure: this.isProduction,
      maxAge: 16 * 60 * 1000,
      sameSite: this.isProduction ? "none" : "lax",
      path: "/",
    });
  }
}
