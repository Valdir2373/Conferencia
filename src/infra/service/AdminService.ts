import { CreateAdmin } from "../../application/users/use-case/CreateAdmin";
import { IUserRepository } from "../../domain/repository/IUserRepository";

export class AdminService {
  private createAdmin: CreateAdmin;
  constructor(private AdminRepository: IUserRepository) {
    this.createAdmin = new CreateAdmin(this.AdminRepository);
  }
  async userToAdmin(email: string): Promise<object> {
    const admin = await this.createAdmin.execute(email);
    if (admin) return { message: "Sucess" };
    return { message: "Failed" };
  }
}
