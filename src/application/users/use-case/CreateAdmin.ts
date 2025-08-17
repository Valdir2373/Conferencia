import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class CreateAdmin {
  constructor(private usersRepository: IUserRepository) {}
  async execute(email: string): Promise<boolean> {
    const user = await this.usersRepository.getByEmail(email);
    if (!user) return false;
    if (user.adm === true) throw new Error("user already admin");

    const userEntities = new UserEntities(
      user.username,
      user.email,
      user.password,
      user.id,
      user.verification,
      user.adm,
      user.created_at,
      user.updated_at
    );

    const verification = user.verification === true;

    let admin: UserEntities | undefined;
    if (verification)
      admin = await this.usersRepository.saveAdmin(userEntities);

    if (admin) return true;
    throw new Error("user not verification");
  }
}
