export interface IAuthUser {
  verifyPasswordFromUserByEmail(
    idUser: string,
    password: string
  ): Promise<boolean>;
  verifyUserAdminByEmail(email: string): Promise<boolean>;
}
