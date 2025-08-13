import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IRequest } from "../server/interfaces/IRequest";
import { IResponse } from "../server/interfaces/IResponse";
import { IServer } from "../server/interfaces/IServer";
import { ConferencesService } from "../service/ConferenceService";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";
import { IUploadFileOptions } from "../server/interfaces/IUploadFileOptions";
import { IJwtUser } from "../interfaces/IJwtUser";

export class ConferenceController {
  constructor(
    private authTokenManager: IAuthTokenManager,
    private conferenceSchemas: ConferenceSchemas,
    private conferencesService: ConferencesService
  ) {}

  async mountRoutes(server: IServer) {
    server.registerRouter("post", "/conference", this.addConference.bind(this));
    server.registerFileUploadRouter(
      "post",
      "/send-pdf",
      this.convertPdfToConference.bind(this)
    );
    server.registerRouter(
      "get",
      "/user-conference",
      this.getConferenceByEmail.bind(this)
    );
    server.registerRouter(
      "get",
      "/conference/:idConference",
      this.getConferenceById.bind(this)
    );
    server.registerRouter(
      "put",
      "/conference/update/:idConference",
      this.updateConferenceById.bind(this)
    );
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
    const { jwt, status } = this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );

    if (!status) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("usuario não autorizado");
    }
    return jwt;
  }

  private async addConference(req: IRequest, res: IResponse) {
    if (!req.cookies) {
      res.status(401).json({ message: "unauthorized" });
      throw new Error("No cookie");
    }
    const { jwt, status } = this.authTokenManager.verifyToken(
      req.cookies.tokenAcess
    );
    if (!status) return res.status(401).json({ message: "unauthorized" });
    const inputData = {
      email: jwt.email,
      date: req.body.date,
      conference: req.body.conference,
    };
    if (!inputData)
      return res.status(400).json({ ERROR: "user field not found " });
    // this.conferenceSchemas.conferenceInputValidator(inputData);
    return res.json({
      message: "conference created",
      success: this.conferencesService.createConference(inputData),
    });
  }

  private async getConference(req: IRequest, res: IResponse) {}
}
