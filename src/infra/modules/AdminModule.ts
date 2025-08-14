import { IDataAccess } from "../../domain/repository/IDataAccess";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { AdminController } from "../controllers/AdminController";
import { UserRepository } from "../repository/UsersRepository";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";
import { AdminService } from "../service/AdminService";
import { UsersService } from "../service/UsersService";

export class AdminModule {
  constructor(
    server: IMiddlewareManagerRoutes,
    authTokenManager: IAuthTokenManager,
    dataAcess: IDataAccess,
    private usersService: UsersService,
    private getUsersSchemas: () => UsersSchemas
  ) {
    const userRepository = new UserRepository(dataAcess);
    const userSchemas = this.getUsersSchemas();
    const adminController = new AdminController(
      this.usersService,
      authTokenManager,
      server
    );
    adminController.mountRouter();
  }
}
