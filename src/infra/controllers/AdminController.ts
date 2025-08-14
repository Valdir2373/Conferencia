import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { UsersService } from "../service/UsersService";

export class AdminController {
  constructor(
    private usersService: UsersService,
    private authTokenManager: IAuthTokenManager,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes
  ) {}
  mountRouter() {
    this.middlewareManagerRoutes.registerRouter(
      "post",
      "/createAdmin",
      this.createAdmin.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/getLink",
      this.createLinkToCreateNewUser.bind(this)
    );
  }
  private async createLinkToCreateNewUser(req: IRequest, res: IResponse) {
    const link = this.authTokenManager.generateTokenTimerSet(
      { message: "link to create user" },
      "60m"
    );
    res.status(200).json(link);
  }
  private async createAdmin(req: IRequest, res: IResponse) {
    const { email } = req.body;
    const result = await this.usersService.userToAdmin(email);
    if (typeof result !== "object") return res.status(200).json(result);
    if (result) return res.status(400).json({ message: result.message });
  }
}
