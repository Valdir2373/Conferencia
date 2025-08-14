import { IServer } from "../server/http/interface/IServer";
import { UsersService } from "../service/UsersService";
import { UsersControllers } from "../controllers/UserController";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IEmailService } from "../interfaces/IEmailService";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class UsersModule {
  private usersController: UsersControllers;
  private usersSchemas: UsersSchemas;

  constructor(
    private server: IServer,
    private authTokenManager: IAuthTokenManager,
    private email: IEmailService,
    private usersService: UsersService,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes,
    private getUsersSchemas: () => UsersSchemas
  ) {
    this.usersSchemas = this.getUsersSchemas();

    this.usersController = new UsersControllers(
      this.usersService,
      this.usersSchemas,
      this.email,
      this.authTokenManager,
      this.middlewareManagerRoutes
    );

    this.usersController.mountRoutes();
  }
}
