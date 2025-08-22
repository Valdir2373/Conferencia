import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IAuthUser } from "../security/auth/IAuthUser";
import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { ConferencesService } from "../service/ConferenceService";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";
import { IJwtUser } from "../security/tokens/IJwtUser";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";
import { ConvertFileTxtById } from "../../application/conferences/use-cases/ConvertFileTxtById";
import path from "path";
import fs from "fs/promises";

export class ConferenceController {
  constructor(
    private authTokenManager: IAuthTokenManager,
    private conferenceSchemas: ConferenceSchemas,
    private conferencesService: ConferencesService,
    private authUser: IAuthUser,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes
  ) {}

  async mountRoutes() {
    this.middlewareManagerRoutes.registerRouterOneUserAllAdmin(
      "get",
      "/conference/downloadById/:idConference",
      this.downloadConferenceByIdToUser.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterOneUserAllAdmin(
      "get",
      "/getCopy/conference/:idConference",
      this.getCopyConference.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUser(
      "post",
      "/conference",
      this.addConference.bind(this)
    );
    this.middlewareManagerRoutes.registerFileUploadRouter(
      "post",
      "/send-pdf",
      this.convertPdfToConference.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUser(
      "get",
      "/user-conference",
      this.getConferenceByEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUser(
      "get",
      "/conference/:idConference",
      this.getConferenceByIdOfEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUser(
      "put",
      "/conference/update/:idConference",
      this.updateConferenceById.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUserWithTwoFactors(
      "delete",
      "/conference/:idConference",
      this.deleteConference.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "post",
      "/conference/byEmail",
      this.getConferenceOfUserByEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToAdmin(
      "get",
      "/admin/conference/:idConference",
      this.getConferenceById.bind(this)
    );
  }

  async getCopyConference(req: IRequest, res: IResponse) {
    const id = req.params.idConference;
    const text = await this.conferencesService.convertConferenceInTextById(id);
    res.status(200).send(text);
  }

  async getConferenceById(req: IRequest, res: IResponse) {
    const conference = await this.conferencesService.getConferenceById(
      req.params.id
    );
    if (!conference) return res.status(400).json({ message: "not conference" });
    return res.status(200).json(conference);
  }
  async downloadConferenceByIdToUser(req: IRequest, res: IResponse) {
    const { idConference } = req.params;
    try {
      const email = req.userPayload.email;
      // const verifyIfConferenceIsOfUserByEmail = ()
      console.log(email);

      const filePathWithName =
        await this.conferencesService.convertConferenceToFileTxtById(
          idConference
        );

      console.log(filePathWithName.split("\\").pop());
      const filePath = filePathWithName;
      console.log(filePath);

      res.download(filePath, "conferencia.txt", (err) => {
        if (err) {
          console.error("Erro ao enviar o arquivo:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Erro ao baixar o arquivo." });
          }
        } else {
          console.log("Arquivo enviado com sucesso.");
        }
      });
      return await fs.rm(filePath);
      // return res.status(200).json({ message: "arquivo enviado" });
    } catch (error: any) {
      if (error.message === "conference not found")
        return res.status(404).json({ message: error.message });
      console.error("Erro no processo de conversão ou download:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  }

  async getConferenceOfUserByEmail(req: IRequest, res: IResponse) {
    const { emailUser } = req.body;
    if (!emailUser) return res.status(400).json({ message: "not emailUser" });
    console.log(emailUser);
    const conferences = await this.conferencesService.getConferencesByEmail(
      emailUser
    );
    if (!conferences)
      return res.status(400).json({ message: "not conferences" });
    res.status(200).json(conferences);
  }

  async deleteConference(req: IRequest, res: IResponse) {
    const conference = await this.conferencesService.deleteConferenceById(
      req.params.idConference
    );
    if (!conference)
      return res.status(404).json({ message: "conference not exist" });
    res.status(200).json({ message: "conference deleted with success" });
  }

  async updateConferenceById(req: IRequest, res: IResponse) {
    const conference = req.body;

    await this.conferencesService.updateConferenceByIdAndEmail(
      conference,
      req.userPayload.email
    );
    res.json({ message: "success" });
  }

  async getConferenceByIdOfEmail(req: IRequest, res: IResponse) {
    // console.log(req.cookies);

    const jwt: IJwtUser = await this.getUserByCookie(req, res);
    const conference =
      await this.conferencesService.getConferenceByIdAndByEmail(
        jwt.email,
        req.params.idConference
      );

    if (!conference)
      return res.status(400).json({ message: "requisition bad request" });

    return res.json(conference);
  }

  private async getConferenceByEmail(req: IRequest, res: IResponse) {
    const conferences = await this.conferencesService.getConferencesByEmail(
      req.userPayload.email
    );
    if (!conferences) return res.json({ message: "not conferences" });

    res.json(conferences);
  }

  private async convertPdfToConference(req: IRequest, res: IResponse) {
    const jwt = await this.getUserByCookie(req, res);
    const pdfFile = req.file("pdfFile");

    if (!pdfFile) {
      return res.status(400).json({ message: "Nenhum arquivo PDF enviado" });
    }

    const inputData = {
      email: jwt.email,
      pdf: pdfFile,
    };

    try {
      const result = await this.conferencesService.convertPdf(inputData);
      // fs.mkdir()
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao processar o PDF" });
    }
  }
  private async getUserByCookie(
    req: IRequest,
    res: IResponse
  ): Promise<IJwtUser> {
    if (!req.cookies) {
      res.status(401).json({ message: "No cookie" });
      throw new Error("usuario não autorizado");
    }
    const result = await this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );

    if (!result.status) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("token invalido");
    }
    return result.jwt;
  }

  private async addConference(req: IRequest, res: IResponse) {
    if (!req.cookies) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("No cookie");
    }
    const result = await this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );
    if (!result.status)
      return res.status(401).json({ message: "unauthorized" });
    const inputData = {
      email: result.jwt.email,
      date: req.body.date,
      conference: req.body.conference,
    };
    if (!inputData)
      return res.status(400).json({ ERROR: "user field not found " });

    return res.json({
      message: "conference created",
      success: this.conferencesService.createConference(inputData),
    });
  }

  private async getConference(req: IRequest, res: IResponse) {}
}
