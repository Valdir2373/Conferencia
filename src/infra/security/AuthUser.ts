import { UsersService } from "../service/UsersService";
import { IAuthUser } from "./tokens/IAuthUser";

export class AuthUser implements IAuthUser {
  constructor(private userService: UsersService) {}
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
