import { Transporter } from "nodemailer";
import { IEmailService } from "./IEmailService";
import { ConfigEmail } from "../../config/ConfigEmail";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
export type TransportFactory = (options: any) => Transporter;

export class NodemailerEmailService implements IEmailService {
  private configEmail: ConfigEmail;

  constructor(
    private create: TransportFactory,
    private token: IAuthTokenManager
  ) {
    this.configEmail = new ConfigEmail();
  }
  async sendLinkResetPassword(userOutput: UserOutputDTO): Promise<any> {
    const link = this.genarateLinkResetPassword(userOutput);

    const message = "Para resetar sua senha prossiga no link abaixo";

    return await this.sendLinkVerificationEmail(
      userOutput.email,
      link,
      25,
      message
    );
  }
  public getTransportToSendEmail(): any {
    const transporterConfig = this.configEmail.getTransporter;
    const transporter = this.create(transporterConfig);
    return transporter;
  }
  public async sendLinkVerificationEmail(
    email: string,
    verificationCode: string,
    tempo: number,
    messageToEmail: string
  ): Promise<any> {
    try {
      const htmlContent = this.getHtmlBody(
        verificationCode,
        tempo,
        messageToEmail
      );

      await this.getTransportToSendEmail().sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Confirmação de E-mail",
        html: htmlContent,
      });

      return {
        success: true,
        message: "E-mail de verificação enviado com sucesso!",
      };
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      return {
        success: false,
        message: `Falha ao enviar o e-mail de verificação: ${error.message}`,
      };
    }
  }

  private getHtmlBody(link: string, tempo: number, message: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Seu link de Confirmação</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    line-height: 1.6;
    color: #333333;
    background-color: #f8f8f8;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e0e0;
  }
  .header {
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #eeeeee;
    margin-bottom: 30px;
  }
  .header h1 {
    color: #007bff;
    font-size: 28px;
    margin: 0;
  }
  .content {
    text-align: center;
    margin-bottom: 30px;
  }
  .content p {
    font-size: 16px;
    margin-bottom: 15px;
  }
  .code-box {
    background-color: #e9ecef;
    padding: 15px 25px;
    border-radius: 5px;
    display: inline-block;
    margin: 20px auto;
  }
  .code-box strong {
    font-size: 28px;
    color: #007bff;
    letter-spacing: 3px;
  }
  .footer {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
    font-size: 14px;
    color: #888888;
    margin-top: 30px;
  }
  .footer a {
    color: #007bff;
    text-decoration: none;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirmação de Ação</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>${message}</p>
      <div class="code-box">
        <a href="${link}">link de verificação</a> </div>
      <p>Este link de verificação é válido por ${tempo} minutos. Se você não solicitou este link de verificação, por favor, ignore este e-mail.</p>
    </div>
    <div class="footer">
      <p>Atenciosamente,<br>Suporte Atacado</p>
      <p><a href="mailto:valdirdesouzajunioradm@gmail.com">Contato</a> | <a href="https://stream-server-vava.onrender.com:443/index.html">Nosso Site</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  public async sendEmailVerificationUser(
    userOutputDTO: UserOutputDTO
  ): Promise<any> {
    const link = this.genarateLinkVerificationUser(userOutputDTO, 15);

    const message =
      "Recebemos uma solicitação de confirmação para sua conta. Por favor, use o link de verificação, abaixo para prosseguir:";

    return await this.sendLinkVerificationEmail(
      userOutputDTO.email,
      link,
      15,
      message
    );
  }
  private genarateLinkVerificationUser(
    userOutputDTO: UserOutputDTO,
    time: number
  ) {
    const expiresMs = time * 60 * 1000;
    const expiresSec = expiresMs / 1000;
    return `https://devoted-robin-striking.ngrok-free.app/verifyEmail/${this.token.generateTokenTimerSet(
      {
        email: userOutputDTO.email,
      },
      expiresSec
    )}`;
  }
  private genarateLinkResetPassword(userOutputDTO: UserOutputDTO) {
    return `https://devoted-robin-striking.ngrok-free.app/reset-password/${this.token.generateTokenTimerSet(
      {
        email: userOutputDTO.email,
      },
      "5m"
    )}`;
  }
}
