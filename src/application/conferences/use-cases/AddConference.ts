import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";
import { ConferenceEntities } from "../../../domain/entities/Conference";
import { ConferenceInput } from "../DTO/ConferenceInput";
import { ICreateId } from "../../../domain/services/ICreateId";

export class AddConference {
  constructor(
    private conferenceRepository: IConferenceRepository,
    private createId: ICreateId
  ) {}

  async execute(conferenceInput: ConferenceInput): Promise<ConferenceEntities> {
    const conferenceEntities: ConferenceEntities =
      ConferenceEntities.generateEntitie(
        conferenceInput.conference,
        conferenceInput.email,
        conferenceInput.date,
        this.createId
      );
    const conferenceResponse: ConferenceEntities | undefined =
      await this.conferenceRepository.createConference(conferenceEntities);
    if (!conferenceResponse)
      throw new Error("error conference create repository");
    return conferenceResponse;
  }
}
