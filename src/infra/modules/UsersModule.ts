import { UsersService } from "../service/UsersService";
import { UsersControllers } from "../controllers/UserController";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IEmailService } from "../email/IEmailService";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class UsersModule {
  private usersController: UsersControllers;

  constructor(
    private authTokenManager: IAuthTokenManager,
    private email: IEmailService,
    private usersService: UsersService,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes,
    private usersSchemas: UsersSchemas
  ) {
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
