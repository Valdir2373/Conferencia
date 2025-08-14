import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { AdminService } from "../service/AdminService";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class AdminController {
  constructor(
    private adminService: AdminService,
    private server: IMiddlewareManagerRoutes
  ) {}
  mountRouter() {
    this.server.registerRouter(
      "post",
      "/createAdmin",
      this.createAdmin.bind(this)
    );
  }
  private async createAdmin(req: IRequest, res: IResponse) {
    const { email } = req.body;
    const message = await this.adminService.userToAdmin(email);
    res.status(200).json(message);
  }
}
