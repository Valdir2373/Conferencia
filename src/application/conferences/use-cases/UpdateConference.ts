import { ConferenceEntities } from "../../../domain/entities/Conference";
import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";
import { ConferenceInputDataUpdate } from "../DTO/ConferenceInputUpdate";

export class UpdateConferenceByEmail {
  constructor(private conferenceRepository: IConferenceRepository) {}

  async execute(conference: ConferenceInputDataUpdate, emailUser: string) {
    const conferenceEntitie: ConferenceEntities | undefined =
      await this.conferenceRepository.getConferenceById(conference.id);

    if (!conferenceEntitie) throw new Error("conference not found");

    const conferenceToUpdate = new ConferenceEntities(
      conference.conference,
      emailUser,
      conference.date,
      conferenceEntitie.id,
      conferenceEntitie.created_at,
      conferenceEntitie.updated_at
    );

    const result = await this.conferenceRepository.updateConference(
      conferenceToUpdate
    );
    if (!result) throw new Error("result not defined");

    return result;
  }
}
