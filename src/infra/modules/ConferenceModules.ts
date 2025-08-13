import { IDataAccess } from "../../domain/repository/IDataAccess";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPdfReadConvert } from "../../domain/services/IPdfReadConvert";
import { ConferenceController } from "../controllers/ConferenceController";
import { ConferenceRepository } from "../repository/ConferenceRepository";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IServer } from "../server/interfaces/IServer";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";
import { ConferencesService } from "../service/ConferenceService";

export class ConferenceModules {
  private conferenceController: ConferenceController;
  private conferenceService: ConferencesService;
  private conferenceRepository: ConferenceRepository;

  constructor(
    private server: IServer,
    private dataAcess: IDataAccess,
    private createId: ICreateId,
    private pdfReadConvert: IPdfReadConvert,
    private authTokenManager: IAuthTokenManager,
    private conferenceSchemas: ConferenceSchemas
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
      this.conferenceService
    );
    this.conferenceService, this.authTokenManager;
    this.conferenceSchemas;

    this.conferenceController.mountRoutes(this.server);
  }
}
