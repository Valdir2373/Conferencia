import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserInputDTO } from "../DTO/UserInput";
import { UserOutputDTO } from "../DTO/UserOutput";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";

export class LoginUser {
  constructor(
    private usersRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}
  async execute(userInput: UserInputDTO): Promise<UserOutputDTO | false> {
    const user: UserEntities | undefined =
      await this.usersRepository.getByEmail(userInput.useremail);
    if (!user) return false;

    const login = await this.passwordHasher.compare(
      userInput.userpassword,
      user.password.trim()
    );

    if (!login) return false;
    return {
      username: user.username,
      email: user.email,
      id: user.id,
    };
  }
}
