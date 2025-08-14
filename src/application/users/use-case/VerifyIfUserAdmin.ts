import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class VerifyIfUserAdmin {
  constructor(private usersRepository: IUserRepository) {}
  async execute(email: string): Promise<boolean> {
    const user = await this.usersRepository.getByEmail(email);
    if (!user) throw new Error("user not found");
    return user.adm;
  }
}
