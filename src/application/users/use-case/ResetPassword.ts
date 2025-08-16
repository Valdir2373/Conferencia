import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { IPasswordHasher } from "../../../infra/security/IPasswordHasher";

export class ResetPasswordById {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}
  async execute(id: string, password: string): Promise<boolean> {
    const userEntity: UserEntities | undefined =
      await this.userRepository.getById(id);

    const hashedPassword = await this.passwordHasher.hash(password);

    if (!userEntity) return false;
    const userToUpdate = new UserEntities(
      userEntity.username,
      userEntity.email,
      hashedPassword,
      userEntity.id,
      userEntity.verification,
      userEntity.adm,
      userEntity.created_at,
      userEntity.updated_at
    );

    const userUpdated = await this.userRepository.UpdateUserById(userToUpdate);
    if (!userUpdated) return false;
    return true;
  }
}
