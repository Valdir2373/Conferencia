import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class GetUserById {
  constructor(private usersRepository: IUserRepository) {}
  async execute(id: string): Promise<UserEntities | undefined> {
    return await this.usersRepository.getById(id);
  }
}
