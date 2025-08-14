import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IAuthUser } from "../security/interfaces/IAuthUser";

import { IRequest } from "../server/middleware/interfaces/IRequest";
import { IResponse } from "../server/middleware/interfaces/IResponse";
import { IServer } from "../server/http/interface/IServer";
import { ConferencesService } from "../service/ConferenceService";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";
import { IUploadFileOptions } from "../server/middleware/interfaces/IUploadFileOptions";
import { IJwtUser } from "../security/interfaces/IJwtUser";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class ConferenceController {
  constructor(
    private authTokenManager: IAuthTokenManager,
    private conferenceSchemas: ConferenceSchemas,
    private conferencesService: ConferencesService,
    private authUser: IAuthUser,
    private middlewareManagerRoutes: IMiddlewareManagerRoutes
  ) {}

  async mountRoutes() {
    this.middlewareManagerRoutes.registerRouter(
      "post",
      "/conference",
      this.addConference.bind(this)
    );
    this.middlewareManagerRoutes.registerFileUploadRouter(
      "post",
      "/send-pdf",
      this.convertPdfToConference.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/user-conference",
      this.getConferenceByEmail.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "get",
      "/conference/:idConference",
      this.getConferenceById.bind(this)
    );
    this.middlewareManagerRoutes.registerRouter(
      "put",
      "/conference/update/:idConference",
      this.updateConferenceById.bind(this)
    );
    this.middlewareManagerRoutes.registerRouterToUserWithTwoFactors(
      "delete",
      "/conference/:idConference",
      this.deleteConference.bind(this)
    );
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
    const user = await this.getUserByCookie(req, res);
    const conference = req.body;
    console.log(conference);

    await this.conferencesService.updateConferenceByIdAndEmail(
      conference,
      user.email
    );
    res.json({ message: "success" });
  }

  async getConferenceById(req: IRequest, res: IResponse) {
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
    const jwt: IJwtUser = await this.getUserByCookie(req, res);
    const conferences = await this.conferencesService.getConferencesByEmail(
      jwt.email
    );
    if (!conferences) return res.json({ message: "not conferences" });

    res.json({ message: conferences });
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

    console.log(inputData);

    try {
      const result = await this.conferencesService.convertPdf(inputData);
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
      throw new Error("usuario não autorizado");
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
