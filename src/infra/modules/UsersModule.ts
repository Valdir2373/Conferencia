import { IServer } from "../server/interfaces/IServer";
import { UsersService } from "../service/UsersService";
import { UsersControllers } from "../controllers/UserController";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IEmailService } from "../interfaces/IEmailService";
import { AuthController } from "../controllers/AuthController";

export class UsersModule {
  private usersService: UsersService;
  private usersController: UsersControllers;
  private usersSchemas: UsersSchemas;

  constructor(
    private server: IServer,
    private authTokenManager: IAuthTokenManager,
    private email: IEmailService,
    private getUsersService: () => UsersService,
    private getUsersSchemas: () => UsersSchemas
  ) {
    this.usersSchemas = this.getUsersSchemas();

    this.usersService = this.getUsersService();

    this.usersController = new UsersControllers(
      this.usersService,
      this.usersSchemas,
      this.email,
      this.authTokenManager
    );

    this.usersController.mountRoutes(this.server);
    const authController = new AuthController(
      this.server,
      this.authTokenManager,
      this.usersService,
      this.email,
      this.usersSchemas
    );
  }
}
