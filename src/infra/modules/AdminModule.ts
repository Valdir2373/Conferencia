import { IDataAccess } from "../../domain/repository/IDataAccess";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { AdminController } from "../controllers/AdminController";
import { AdminRepository } from "../repository/AdminRepository";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";
import { AdminService } from "../service/AdminService";

export class AdminModule {
  constructor(
    server: IMiddlewareManagerRoutes,
    dataAcess: IDataAccess,
    private getUsersSchemas: () => UsersSchemas
  ) {
    const adminRepository = new AdminRepository(dataAcess);
    const adminService = new AdminService(adminRepository);
    const userSchemas = this.getUsersSchemas();
    const adminController = new AdminController(adminService, server);
    adminController.mountRouter();
  }
}
