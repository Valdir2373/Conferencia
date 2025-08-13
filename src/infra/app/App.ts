import { ExpressAdapter } from "../server/implementation/ExpressAdapter";
import { IServer } from "../server/interfaces/IServer";
import { UsersModule } from "../modules/UsersModule";
import { ConfigDB } from "../../config/ConfigDB";
import { IDataAccess } from "../../domain/repository/IDataAccess";
import { JsonwebtokenAuthTokenManager } from "../security/JwtAuthService";
import { ZodDTOBuilderAndValidator } from "../../shared/validator/ZodDTOBuilderAndValidatorImpl";
import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IUserLogin } from "../interfaces/IUserLogin";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler";
import { MongooseHandler } from "../database/MongooseHandler";
import { MongooseDataAccess } from "../database/MoongoseDataAcess";
import mongoose from "mongoose";
import { NodemailerEmailService } from "../email/NodemailerEmailService";
import { createTransport } from "nodemailer";
import { IEmailService } from "../interfaces/IEmailService";
import { AdminModule } from "../modules/AdminModule";
import { Server as HttpServer } from "http";
import { CreateIdImpl } from "../../shared/utils/CreateId";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { UsersService } from "../service/UsersService";
import { UserRepository } from "../repository/UsersRepository";
import { IPdfReadConvert } from "../../domain/services/IPdfReadConvert";
import { PdfParseImpl } from "../pdf/PdfParserImpl";
import { ConferenceModules } from "../modules/ConferenceModules";
import { ConferenceInput } from "../../application/conferences/DTO/ConferenceInput";
import { ConferenceSchemas } from "../../schemas/ConferenceSchemas";

export class AppModule {
  private configDB: ConfigDB;
  private dbHandler: IDatabaseHandler<mongoose.Mongoose>;
  private dataAccess: IDataAccess;
  private authTokenManager: IAuthTokenManager;
  private email: IEmailService;
  private createId: ICreateId;
  private pdfReadConvert: IPdfReadConvert;
  private passwordHasher: IPasswordHasher;
  private server: IServer;

  constructor() {
    this.pdfReadConvert = new PdfParseImpl();
    this.configDB = new ConfigDB();
    this.dbHandler = new MongooseHandler(this.configDB.getConfigDB());
    this.dataAccess = new MongooseDataAccess(this.dbHandler);

    this.authTokenManager = new JsonwebtokenAuthTokenManager();
    this.email = new NodemailerEmailService(
      createTransport,
      this.authTokenManager
    );

    this.createId = new CreateIdImpl();
    this.passwordHasher = new BcryptPasswordHasher();

    this.server = new ExpressAdapter();
  }

  private injectDepenciesOnSchemasUser() {
    const validatorUserInputDto = new ZodDTOBuilderAndValidator<UserInputDTO>();
    const validatorUserLogin = new ZodDTOBuilderAndValidator<IUserLogin>();
    return new UsersSchemas(validatorUserInputDto, validatorUserLogin);
  }
  private injectDepenciesOnSchemasConference() {
    const validatorConferenceInputDto =
      new ZodDTOBuilderAndValidator<ConferenceInput>();
    return new ConferenceSchemas(validatorConferenceInputDto);
  }

  private Modules() {
    new ConferenceModules(
      this.server,
      this.dataAccess,
      this.createId,
      this.pdfReadConvert,
      this.authTokenManager,
      this.injectDepenciesOnSchemasConference()
    );
    new UsersModule(
      this.server,
      this.authTokenManager,
      this.email,
      this.getUsersService.bind(this),
      this.injectDepenciesOnSchemasUser
    );
    new AdminModule(
      this.server,
      this.dataAccess,
      this.injectDepenciesOnSchemasUser
    );
  }

  public async listen(port: number): Promise<void> {
    this.Modules();

    const httpServerInstance: HttpServer = this.server.listen(
      port
    ) as HttpServer;

    process.on("SIGTERM", async () => {
      console.log("SIGTERM recebido. Fechando pool de DB e servidores...");
      await this.gracefulShutdown(httpServerInstance);
    });
    process.on("SIGINT", async () => {
      console.log("SIGINT recebido. Fechando pool de DB e servidores...");
      await this.gracefulShutdown(httpServerInstance);
    });
  }

  private async gracefulShutdown(httpServer: HttpServer): Promise<void> {
    httpServer.close(async () => {
      console.log("Servidor HTTP fechado.");

      if (this.dbHandler) {
        await this.dbHandler.closePool();
        console.log("Pool de DB fechado.");
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forçando desligamento após timeout de 10 segundos.");
      process.exit(1);
    }, 10000);
  }

  private getUsersService(): UsersService {
    const usersRepository = new UserRepository(this.dataAccess);
    const usersService = new UsersService(
      usersRepository,
      this.createId,
      this.passwordHasher
    );
    return usersService;
  }
}
