import { IUserLoginDto } from "../../../application/users/DTO/IUserLoginDto";
import { UsersService } from "../../service/UsersService";
import { IAuthUser } from "./IAuthUser";

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
  async verifyPasswordFromUserByEmail(
    emailUser: string,
    password: string
  ): Promise<boolean> {
    const userLogin: IUserLoginDto = {
      useremail: emailUser,
      userpassword: password,
    };
    const user = await this.userService.loginUserService(userLogin);
    return user ? true : false;
  }
}
