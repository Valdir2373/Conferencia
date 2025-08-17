import { IUserRepository } from "../../domain/repository/IUserRepository";
import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { DeleteByIdUser } from "../../application/users/use-case/DeleteByIdUser";
import { GetAllUsers } from "../../application/users/use-case/GetAllUsers";
import { GetUserByEmail } from "../../application/users/use-case/GetUserByEmail";
import { GetUserById } from "../../application/users/use-case/GetUserById";
import { UpdateUserById } from "../../application/users/use-case/UpdateUserById";
import { UserCreate } from "../../application/users/use-case/UserCreate";
import { LoginUser } from "../../application/users/use-case/LoginUser";
import { IPasswordHasher } from "../security/IPasswordHasher";
import { ICreateId } from "../../domain/services/ICreateId";
import { UserAlreadyExistsError } from "../../shared/error/UserAlreadyExistsError";
import { IUserLoginDto } from "../../application/users/DTO/IUserLoginDto";
import { AuthenticateUserByEmail } from "../../application/users/use-case/AuthenticateUserByEmail";
import { CreateAdmin } from "../../application/users/use-case/CreateAdmin";
import { VerifyIfUserAdmin } from "../../application/users/use-case/VerifyIfUserAdmin";
import { UserOutputToAdminDTO } from "../../application/users/DTO/UserOutputToAdminDTO";
import { IUserToUpdateDTO } from "../../application/users/DTO/IUserToUpdateDTO";
import { ResetPasswordById } from "../../application/users/use-case/ResetPassword";

export class UsersService {
  private usersRepository: IUserRepository;
  private resetPasswordById: ResetPasswordById;
  private userCreate: UserCreate;
  private getAllUsersUseCase: GetAllUsers;
  private deleteByIdUser: DeleteByIdUser;
  private getUserByEmail: GetUserByEmail;
  private getUserById: GetUserById;
  private updateUserByIdUseCase: UpdateUserById;
  private loginUser: LoginUser;
  private createAdmin: CreateAdmin;
  private verifyIfUserAdmin: VerifyIfUserAdmin;
  private authenticateUserByEmail: AuthenticateUserByEmail;

  constructor(
    readonly UsersRepository: IUserRepository,
    private createId: ICreateId,
    private passwordHasher: IPasswordHasher
  ) {
    this.usersRepository = UsersRepository;
    this.userCreate = new UserCreate(
      this.usersRepository,
      this.passwordHasher,
      this.createId
    );
    this.getAllUsersUseCase = new GetAllUsers(this.UsersRepository);
    this.deleteByIdUser = new DeleteByIdUser(this.UsersRepository);
    this.getUserByEmail = new GetUserByEmail(this.usersRepository);
    this.getUserById = new GetUserById(this.usersRepository);
    this.updateUserByIdUseCase = new UpdateUserById(
      this.usersRepository,
      this.passwordHasher
    );
    this.authenticateUserByEmail = new AuthenticateUserByEmail(
      this.usersRepository
    );
    this.loginUser = new LoginUser(this.usersRepository, this.passwordHasher);
    this.createAdmin = new CreateAdmin(this.usersRepository);
    this.verifyIfUserAdmin = new VerifyIfUserAdmin(this.usersRepository);
    this.resetPasswordById = new ResetPasswordById(
      this.usersRepository,
      this.passwordHasher
    );
  }

  async resetPasswordByEmail(email: string, password: string) {
    const user = await this.getUserByEmail.execute(email);
    if (!user) throw new Error("user not found");
    const passwordReseted = await this.resetPasswordById.execute(
      user.id,
      password
    );
    return passwordReseted;
  }
  async createNewUser(user: UserInputDTO): Promise<UserOutputDTO> {
    try {
      if (await this.getByEmailUser(user.useremail))
        throw new UserAlreadyExistsError("Usuário com este email já existe.");
    } catch (e: any) {
      if (e.message !== "user not found") throw e;
    }

    try {
      const newUser: UserOutputDTO | undefined = await this.userCreate.execute(
        user
      );
      if (!newUser) {
        console.error("Erro: userCreate.execute não retornou um novo usuário.");

        throw new Error("Erro ao criar novo usuário: retorno vazio.");
      }

      return {
        email: newUser.email,
        username: newUser.username,
        id: newUser.id,
      };
    } catch (error: any) {
      console.error(
        "Um erro ocorreu durante a criação do usuário:",
        error.message
      );
      throw new Error("Erro interno ao criar usuário.");
    }
  }
  async sendVerificationEmail(email: string) {}

  async adminUpdateUserById(userToUpdateDTO: IUserToUpdateDTO) {
    try {
      const userNow = await this.getUserById.execute(userToUpdateDTO.id);

      if (!userNow) throw new Error("id not exist");
      if (userToUpdateDTO.email) {
        const verifyIfExistUserWhithEmail = await this.getByEmailUser(
          userToUpdateDTO.email
        );
        if (verifyIfExistUserWhithEmail) throw new Error("Email already exist");
      }
      const userUpdated: UserInputDTO = {
        id: userToUpdateDTO.id,
        useremail: userToUpdateDTO.email || userNow.email,
        username: userToUpdateDTO.name || userNow.username,
        userpassword: userToUpdateDTO.password || userNow.password,
      };

      const result = await this.updateUserById(userUpdated);

      if (!result) throw new Error("undefined user updated");
      return result;
    } catch (e: any) {
      if (e.message === "id not exist") return console.log("id not exist");

      throw e;
    }
  }

  async getAllUsers(): Promise<UserOutputToAdminDTO[] | undefined> {
    return await this.getAllUsersUseCase.execute();
  }
  async deleteUser(id: string): Promise<any> {
    return await this.deleteByIdUser.execute(id);
  }
  async getByIdUser(id: string): Promise<UserOutputDTO | undefined> {
    const user = await this.getUserById.execute(id);
    if (!user) return;
    const userById: UserOutputDTO = {
      username: user.username,
      email: user.email,
      id: user.id,
    };
    return userById;
  }
  async getByEmailUser(email: string): Promise<UserOutputDTO | undefined> {
    try {
      const userEntities = await this.getUserByEmail.execute(email);
      const userByEmail: UserOutputDTO = {
        username: userEntities.username,
        email: userEntities.email,
        id: userEntities.id,
      };
      return userByEmail;
    } catch (e: any) {
      if (e.message === "user not found") return;
    }
  }

  async userToAdmin(
    id: string
  ): Promise<boolean | { status: false; message: string }> {
    try {
      const user = await this.getByIdUser(id);
      if (!user) throw new Error("user not found");
      const admin = await this.createAdmin.execute(user.email);
      return admin;
    } catch (e: any) {
      if (e.message === "user already admin")
        return { status: false, message: "user already admin" };
      if (e.message === "user not found") return false;
      throw e;
    }
  }

  async verifyIfUserAdminByEmail(email: string): Promise<boolean> {
    return await this.verifyIfUserAdmin.execute(email);
  }

  async updateUserById(user: UserInputDTO): Promise<UserOutputDTO | undefined> {
    return await this.updateUserByIdUseCase.execute(user);
  }
  async loginUserService(
    userLogin: IUserLoginDto
  ): Promise<UserOutputDTO | false> {
    const userOutput = await this.getByEmailUser(userLogin.useremail);
    if (!userOutput) return false;
    const user = await this.getUserByEmail.execute(userOutput.email);
    if (user.verification !== true) throw new Error("user not verificated");
    const userInput: UserInputDTO = {
      id: user.id,
      useremail: user.email,
      username: user.username,
      userpassword: userLogin.userpassword,
    };
    const login: false | UserOutputDTO = await this.loginUser.execute(
      userInput
    );
    if (!login) return false;
    return login;
  }

  public async verifyUserByEmail(email: string): Promise<boolean> {
    const user = await this.getUserByEmail.execute(email);
    return user ? true : false;
  }
  public async authenticateUser(email: string): Promise<boolean> {
    return await this.authenticateUserByEmail.execute(email);
  }
}
