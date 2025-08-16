import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserInputDTO } from "../DTO/UserInput";
import { UserOutputDTO } from "../DTO/UserOutput";
import { IPasswordHasher } from "../../../infra/security/IPasswordHasher";

export class UpdateUserById {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}
  async execute(userInput: UserInputDTO): Promise<UserOutputDTO | undefined> {
    const userEntity: UserEntities | undefined =
      await this.userRepository.getById(userInput.id);

    const hashedPassword = await this.passwordHasher.hash(
      userInput.userpassword
    );

    if (!userEntity) return;
    let verification: boolean | Date =
      userInput.useremail === userEntity.email
        ? userEntity.verification
        : new Date();

    const userToUpdate = new UserEntities(
      userInput.username,
      userInput.useremail,
      hashedPassword,
      userInput.id,
      verification,
      userEntity.adm,
      userEntity.created_at,
      userEntity.updated_at
    );

    const userUpdated = await this.userRepository.UpdateUserById(userToUpdate);
    if (!userUpdated) return;
    return {
      username: userUpdated.username,
      email: userUpdated.email,
      id: userUpdated.id,
    };
  }
}
