import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { IServer } from "../server/http/interface/IServer";
import { UsersService } from "../service/UsersService";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";

import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IEmailService } from "../interfaces/IEmailService";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class UsersControllers {
  constructor(
    private userService: UsersService,
    private usersSchemas: UsersSchemas,
    private email: IEmailService,
    private token: IAuthTokenManager,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes
  ) {}

  public async mountRoutes() {
    this.middlewareManagerRoutes.registerRouterAuthenticTokenToCreate(
      "post",
      "/register/:idTokenCreate",
      this.createUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "get",
      "/users",
      this.allUsers.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
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
    this.middlewareManagerRoutes.registerRouter(
      "put",
      "/users/update",
      this.resetPassword.bind(this)
    );
  }

  private async resetPassword(req: IRequest, res: IResponse) {
    const { password, newPass } = req.body;
    const user = await this.getEmailByToken(req, res);
    if (!user) return;
    console.log(user);
  }

  private async createUser(req: IRequest, res: IResponse): Promise<any> {
    try {
      const inputData = req.body;
      console.log(inputData);

      if (!inputData)
        return res.status(401).json({ ERROR: "user field not found " });
      this.usersSchemas.usersInputValidator(inputData);
      const userOutput: UserOutputDTO = await this.userService.createNewUser(
        inputData
      );
      await this.email.sendEmailVerificationUser(userOutput);
      const tokenToRevoke = req.params.idTokenCreate;
      await this.token.revokeTokenTimerSet(tokenToRevoke);
      return res.status(201).json(userOutput);
    } catch (e: any) {
      if (e.message === "Erro de validação do DTO") return;

      if (e.message === "Usuário com este email já existe.")
        return res.status(401).json({ message: e.message });

      console.error(e);
    }
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
