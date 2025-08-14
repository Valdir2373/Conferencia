import { UsersService } from "../../service/UsersService";
import { IAuthUser } from "../interfaces/IAuthUser";

export class AuthUser implements IAuthUser {
  constructor(private userService: UsersService) {}
  async verifyUserAdminByEmail(email: string): Promise<boolean> {
    try {
      return await this.userService.verifyIfUserAdminByEmail(email);
    } catch (e: any) {
      if (e.message === "user not found") return false;
      throw e;
    }
  }
  login(email: string, password: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async verifyPasswordFromUserByEmail(
    emailUser: string,
    password: string
  ): Promise<boolean> {
    const user = await this.userService.loginUserService({
      useremail: emailUser,
      userpassword: password,
    });
    return user ? true : false;
  }
}
