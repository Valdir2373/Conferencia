import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserOutputToAdminDTO } from "../DTO/UserOutputToAdminDTO";

export class GetAllUsers {
  constructor(private userRepository: IUserRepository) {}
  async execute(): Promise<UserOutputToAdminDTO[] | undefined> {
    const allUsers = await this.userRepository.getAllUsers();

    if (!allUsers) return;
    const usersOutputList: UserOutputToAdminDTO[] = allUsers.map(
      (userEnti: UserEntities) => {
        const verification = typeof userEnti.verification === "boolean";
        return {
          email: userEnti.email,
          id: userEnti.id,
          adm: userEnti.adm,
          username: userEnti.username,
          created: userEnti.created_at,
          verification: verification,
        };
      }
    );
    return usersOutputList;
  }
}
