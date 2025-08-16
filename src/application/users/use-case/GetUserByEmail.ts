import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class GetUserByEmail {
  constructor(private usersRepository: IUserRepository) {}
  async execute(email: string): Promise<UserEntities> {
    const outputRepository = await this.usersRepository.getByEmail(email);

    if (!outputRepository) throw new Error("user not found");

    return outputRepository;
  }
}
