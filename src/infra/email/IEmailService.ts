import { UserOutputDTO } from "../../application/users/DTO/UserOutput";

export interface IEmailService {
  sendEmailVerificationUser(userOutput: UserOutputDTO): Promise<any>;
  sendLinkResetPassword(userOutput: UserOutputDTO): Promise<any>;
}
