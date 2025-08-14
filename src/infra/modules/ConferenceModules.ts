import { IDataAccess } from "../../domain/repository/IDataAccess";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPdfReadConvert } from "../../domain/services/IPdfReadConvert";
import { ConferenceController } from "../controllers/ConferenceController";
import { ConferenceRepository } from "../repository/ConferenceRepository";
import { IAuthTokenManager } from "../security/interfaces/IAuthTokenManager";
import { IServer } from "../server/http/interface/IServer";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";
import { ConferencesService } from "../service/ConferenceService";
import { IAuthUser } from "../security/interfaces/IAuthUser";
import { IMiddlewareManagerRoutes } from "../server/middleware/interfaces/IMiddlewareManagerRoutes";

export class ConferenceModules {
  private conferenceController: ConferenceController;
  private conferenceService: ConferencesService;
  private conferenceRepository: ConferenceRepository;

  constructor(
    private middlewareManagerRoutes: IMiddlewareManagerRoutes,
    private dataAcess: IDataAccess,
    private createId: ICreateId,
    private pdfReadConvert: IPdfReadConvert,
    private authTokenManager: IAuthTokenManager,
    private conferenceSchemas: ConferenceSchemas,
    private authUser: IAuthUser
  ) {
    this.conferenceRepository = new ConferenceRepository(this.dataAcess);
    this.conferenceService = new ConferencesService(
      this.conferenceRepository,
      this.createId,
      this.pdfReadConvert
    );
    this.conferenceController = new ConferenceController(
      this.authTokenManager,
      this.conferenceSchemas,
      this.conferenceService,
      this.authUser,
      this.middlewareManagerRoutes
    );
    this.conferenceService, this.authTokenManager;
    this.conferenceSchemas;

    this.conferenceController.mountRoutes();
  }
}
