import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { UsersService } from "../service/UsersService";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IEmailService } from "../email/IEmailService";
import {
  IAuthTokenManager,
  ITokenVerified,
  ITokenVerifiedEmailToVerify,
} from "../security/tokens/IAuthTokenManager";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";
import { IUserRegister } from "../../application/users/DTO/IUserRegister";
import { IJwtUser, IJwtUserToVerify } from "../security/tokens/IJwtUser";

export class UsersControllers {
  private isProduction = process.env.NODE_ENV === "production";
  constructor(
    private userService: UsersService,
    private usersSchemas: UsersSchemas,
    private email: IEmailService,
    private token: IAuthTokenManager,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes
  ) {}

  public async mountRoutes() {
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "get",
      "/getLink",
      this.createLinkToCreateNewUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "get",
      "/users",
      this.allUsers.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterAuthenticTokenToCreate(
      "post",
      "/register/:idTokenCreate",
      this.createUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdminWithTwoFactors(
      "delete",
      "/users/delete/:id",
      this.deleteUserID.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/users/email/:email",
      this.getUserEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/users/id/:id",
      this.getUserId.bind(this)
    );
    // this.middlewareManagerRoutes.registerRouter(
    //   "put",
    //   "/users/update",
    //   this.resetPassword.bind(this)
    // );
    this.middlewareManagerRoutes.registerRouterToAdminWithTwoFactors(
      "post",
      "/create-admin",
      this.createAdmin.bind(this)
    );

    this.middlewareManagerRoutes.registerRouterToUser(
      "get",
      "/user-adm",
      this.verifyIfUserIsAdm.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "post",
      "/admin/update-user",
      this.adminUpdateUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "post",
      "/admin/reset/password",
      this.adminResetPassword.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "put",
      "/reset/password",
      this.resetPasswordByEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUserWithTwoFactors(
      "put",
      "/newPassword",
      this.replacePassword.bind(this)
    );
  }
  private async replacePassword(req: IRequest, res: IResponse) {
    try {
      const { newPass } = req.body;
      const user = req.userPayload;
      const result = await this.userService.resetPasswordByEmail(
        user.email,
        newPass
      );
      if (!result) res.status(400).json({ message: "bad request" });
      res.status(200).json({ message: "password switched" });
    } catch (e: any) {
      if (e.message === "user not found")
        return res.status(404).json({ message: "user not found" });
      res.status(500).json({ message: "err internal" });
    }
  }
  private async adminResetPassword(req: IRequest, res: IResponse) {
    const user = await this.userService.getByIdUser(req.body.id);
    if (!user) return res.status(400).json({ message: "bad request" });
    await this.email.sendLinkResetPassword(user);
    res.status(200).json({ message: "success" });
  }
  private async adminUpdateUser(req: IRequest, res: IResponse) {
    try {
      const userUpdated = await this.userService.adminUpdateUserById(req.body);
      if (!userUpdated) return res.status(400).json({ message: "BAD REQUEST" });
      if (req.body.email)
        await this.email.sendEmailVerificationUser(userUpdated);
      return res.status(200).json({ message: "success" });
    } catch (e: any) {
      if (e.message === "Email already exist")
        return res.status(409).json({
          message: "Email already exist",
        });
      throw e;
    }
  }
  private async verifyIfUserIsAdm(req: IRequest, res: IResponse) {
    const email = req.userPayload.email;

    if (!email) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const adm: boolean = await this.userService.verifyIfUserAdminByEmail(
        email
      );
      if (!adm) {
        return res.status(403).json({ message: "user not is adm" });
      }
      return res.status(200).json({ message: "user is adm" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  private async createLinkToCreateNewUser(req: IRequest, res: IResponse) {
    const token = this.token.generateTokenTimerSet(
      { message: "link to create user" },
      "24h"
    );
    res.status(200).send(token);
  }
  private async createAdmin(req: IRequest, res: IResponse) {
    try {
      const { id } = req.body;

      const result = await this.userService.userToAdmin(id);
      console.log(result);

      if (typeof result !== "object" && result)
        return res.status(200).json(result);
      if (!result) return res.status(404).json({ menubar: "user not found" });
      if (result) return res.status(400).json({ message: result.message });
    } catch (e: any) {
      if (e.message === "user not verification")
        return res.status(403).json({ message: e.message });
    }
  }
  private async resetPasswordByEmail(req: IRequest, res: IResponse) {
    try {
      const { token, password } = req.body;

      const user = await this.token.verifyTokenTimerSet<ITokenVerified>(token);

      if (!user.status)
        return res.status(401).json({ message: "unauthorized" });
      const result = await this.userService.resetPasswordByEmail(
        user.jwt.email,
        password
      );
      console.log(result);

      if (!result) res.status(400).json({ message: "bad request" });
      res.status(200).json({ message: "password reseted" });
    } catch (e: any) {
      if (e.message === "user not found")
        return res.status(404).json({ message: "user not found" });
      res.status(500).json({ message: "err internal" });
    }
  }
  private async createUser(req: IRequest, res: IResponse): Promise<any> {
    try {
      const inputData = req.body;

      const token = req.params.idTokenCreate;
      if (req.cookies) {
        const userToRegister = await this.redirectUserToPageConfirmEmail(req);
        if (userToRegister)
          if (userToRegister.status)
            return res.status(403).json({
              email: userToRegister.email,
            });
      }
      if (!inputData)
        return res.status(401).json({ ERROR: "user field not found " });

      this.usersSchemas.usersInputValidator(inputData);
      const userOutput: UserOutputDTO = await this.userService.createNewUser(
        inputData
      );

      await this.email.sendEmailVerificationUser(userOutput);
      this.defineCookieRegister(res, {
        email: userOutput.email,
      });

      return res.status(201).json(userOutput);
    } catch (e: any) {
      console.log(e);

      if (e.message === "Erro de validação do DTO")
        return res.status(400).json({ message: e.details[0].message });

      if (e.message === "Usuário com este email já existe.")
        return res.status(401).json({ message: e.message });

      console.error(e);
    }
  }

  private async redirectUserToPageConfirmEmail(
    req: IRequest
  ): Promise<false | IJwtUserToVerify> {
    if (!req.cookies) return false;
    const emailToRegister =
      await this.token.verifyTokenTimerSet<ITokenVerifiedEmailToVerify>(
        req.cookies.tokenRegister
      );

    if (!emailToRegister.status) return false;

    return emailToRegister.jwt;
  }

  private defineCookieRegister(res: IResponse, userRegister: IUserRegister) {
    const expiresMs = 4 * 60 * 60 * 1000; // 4 horas em milissegundos
    const expiresSec = expiresMs / 1000; // 4 horas em segundos para o JWT

    const tokenRegister = this.token.generateTokenTimerSet(
      userRegister,
      expiresSec
    );
    res.cookie("tokenRegister", tokenRegister, {
      httpOnly: true,
      partitioned: true,
      secure: this.isProduction,
      maxAge: 4 * 60 * 60 * 1000,
      sameSite: this.isProduction ? "none" : "lax",
      path: "/",
    });
    console.log(tokenRegister);
  }

  private async allUsers(req: IRequest, res: IResponse): Promise<any> {
    const usersOutputList: UserOutputDTO[] | undefined =
      await this.userService.getAllUsers();
    res.json(usersOutputList);
  }
  private async deleteUserID(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.deleteUser(req.params.id);
    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }
  private async getUserId(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.getByIdUser(req.params.id);
    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }
  private async getUserEmail(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.getByEmailUser(req.params.email);
    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }
  private async getEmailByToken(req: IRequest, res: IResponse) {
    const tokenAcess = req.cookies?.tokenAcess;
    if (!tokenAcess) {
      res.json({ message: "unauthorized" });
      return;
    }
    return this.token.verifyToken(tokenAcess);
  }
}
