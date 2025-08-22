import { ReturnDocument } from "mongodb";
import { ConferenceInput } from "../../application/conferences/DTO/ConferenceInput";
import { AddConference } from "../../application/conferences/use-cases/AddConference";
import { ICreateId } from "../../domain/services/ICreateId";
import { ConferenceRepository } from "../repository/ConferenceRepository";
import { IPdfReadConvert } from "../pdf/IPdfReadConvert";
import { ConvertPdtToConference } from "../../application/conferences/use-cases/ConvertPdtToConference";
import { PdfFileMetadata } from "../../application/conferences/DTO/PdfFileMetadata";
import { GetConferenceByEmail } from "../../application/conferences/use-cases/GetConferenceByEmail";
import { GetConferenceById } from "../../application/conferences/use-cases/GetConferenceById";
import { ConferencesOutput } from "../../application/conferences/DTO/ConferenceOutput";
import { UpdateConferenceByEmail } from "../../application/conferences/use-cases/UpdateConference";
import { ConferenceInputDataUpdate } from "../../application/conferences/DTO/ConferenceInputUpdate";
import { DeleteConferenceById } from "../../application/conferences/use-cases/DeleteConferenceById";
import { ConvertFileTxtById } from "../../application/conferences/use-cases/ConvertFileTxtById";
import { ConvertConferenceInText } from "../../application/conferences/use-cases/ConvertConferenceInText";

export class ConferencesService {
  private addConference: AddConference;
  private convertPdtToConference: ConvertPdtToConference;
  private deleteByIdOneConference: DeleteConferenceById;
  private getConferenceByEmailUseCase: GetConferenceByEmail;
  private getConferenceByIdUseCase: GetConferenceById;
  private updateConferenceByEmail: UpdateConferenceByEmail;
  private convertFileTxtById: ConvertFileTxtById;
  private convertConferenceInText: ConvertConferenceInText;
  constructor(
    private conferenceRepository: ConferenceRepository,
    private createId: ICreateId,
    private pdfReadConvert: IPdfReadConvert
  ) {
    this.updateConferenceByEmail = new UpdateConferenceByEmail(
      this.conferenceRepository
    );
    this.addConference = new AddConference(
      this.conferenceRepository,
      this.createId
    );
    this.convertPdtToConference = new ConvertPdtToConference();
    this.getConferenceByEmailUseCase = new GetConferenceByEmail(
      this.conferenceRepository
    );
    this.convertFileTxtById = new ConvertFileTxtById();
    this.deleteByIdOneConference = new DeleteConferenceById(
      this.conferenceRepository
    );
    this.convertConferenceInText = new ConvertConferenceInText(
      this.conferenceRepository
    );
    this.getConferenceByIdUseCase = new GetConferenceById(
      this.conferenceRepository
    );
  }
  async convertConferenceToFileTxtById(id: string) {
    const text = await this.convertConferenceInTextById(id);
    return await this.convertFileTxtById.execute(text);
  }
  async convertConferenceInTextById(id: string) {
    return await this.convertConferenceInText.execute(id);
  }

  async getConferenceById(id: string) {
    return await this.getConferenceByIdUseCase.execute(id);
  }
  async createConference(conferenceInput: ConferenceInput) {
    const conference = await this.addConference.execute(conferenceInput);
    return conference;
  }
  async convertPdf(inputData: { email: string; pdf: PdfFileMetadata }) {
    try {
      const txt = await this.convertPdtToConference.execute(inputData.pdf);
      return txt;
    } catch (r) {
      console.error(r);
    }
  }
  async getConferencesByEmail(
    email: string
  ): Promise<ConferencesOutput[] | false> {
    return await this.getConferenceByEmailUseCase.execute(email);
  }
  async getConferenceByIdAndByEmail(
    email: string,
    id: string
  ): Promise<ConferencesOutput | false> {
    const allConferences = await this.getConferencesByEmail(email);
    if (!allConferences) return false;
    for (const conference of allConferences) {
      if (conference.id === id) return conference;
    }
    return false;
  }
  async updateConferenceByIdAndEmail(
    conference: ConferenceInputDataUpdate,
    email: string
  ) {
    await this.updateConferenceByEmail.execute(conference, email);

    return { message: "ok" };
  }
  async deleteConferenceById(id: string): Promise<boolean> {
    return await this.deleteByIdOneConference.execute(id);
  }
}
