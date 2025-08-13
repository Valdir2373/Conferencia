import { ReturnDocument } from "mongodb";
import { ConferenceInput } from "../../application/conferences/DTO/ConferenceInput";
import { AddConference } from "../../application/conferences/use-cases/AddConference";
import { ICreateId } from "../../domain/services/ICreateId";
import { ConferenceRepository } from "../repository/ConferenceRepository";
import { IPdfReadConvert } from "../../domain/services/IPdfReadConvert";
import { ConvertPdtToConference } from "../../application/conferences/use-cases/ConvertPdtToConference";
import { PdfFileMetadata } from "../../application/conferences/DTO/PdfFileMetadata";
import { GetConferenceByEmail } from "../../application/conferences/use-cases/GetConferenceByEmail";
import { GetConferenceById } from "../../application/conferences/use-cases/GetConferenceById";
import { ConferencesOutput } from "../../application/conferences/DTO/ConferenceOutput";
import { UpdateConferenceById } from "../../application/conferences/use-cases/UpdateConference";
import { ConferenceInputDataUpdate } from "../../application/conferences/DTO/ConferenceInputUpdate";
import { ConferenceEntities } from "../../domain/entities/Conference";

export class ConferencesService {
  private addConference: AddConference;
  private convertPdtToConference: ConvertPdtToConference;
  private getConferenceByEmailUseCase: GetConferenceByEmail;
  private getConferenceById: GetConferenceById;
  private updateConferenceById: UpdateConferenceById;
  constructor(
    private conferenceRepository: ConferenceRepository,
    private createId: ICreateId,
    private pdfReadConvert: IPdfReadConvert
  ) {
    this.updateConferenceById = new UpdateConferenceById(
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
    this.getConferenceById = new GetConferenceById(this.conferenceRepository);
  }
  async createConference(conferenceInput: ConferenceInput) {
    const conference = await this.addConference.execute(conferenceInput);
    console.log(conference);
    return conference;
  }
  async convertPdf(inputData: { email: string; pdf: PdfFileMetadata }) {
    try {
      const txt = await this.convertPdtToConference.execute(inputData.pdf);
      return txt;
    } catch (r) {
      console.log(r);
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
    const result = await this.updateConferenceById.execute(conference, email);
    console.log(result);

    return { message: "ok" };
  }
}
