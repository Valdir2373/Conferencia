export interface IAuthUser {
  verifyPasswordFromUserByEmail(
    idUser: string,
    password: string
  ): Promise<boolean>;
  login(email: string, password: string): Promise<void>;
}
