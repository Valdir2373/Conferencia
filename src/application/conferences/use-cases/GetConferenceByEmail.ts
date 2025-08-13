import { ConferenceEntities } from "../../../domain/entities/Conference";
import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";
import { ConferencesOutput } from "../DTO/ConferenceOutput";

export class GetConferenceByEmail {
  constructor(private conferenceRepository: IConferenceRepository) {}
  async execute(email: string): Promise<ConferencesOutput[] | false> {
    const conferencesEntities: ConferenceEntities[] | undefined =
      await this.conferenceRepository.getConferenceByEmail(email);
    if (!conferencesEntities) return false;
    const conferencesOutput: ConferencesOutput[] = conferencesEntities.map(
      (conference) => {
        return {
          date: conference.date,
          conference: conference.conference,
          created: conference.created_at,
          updated: conference.updated_at,
          id: conference.id,
        };
      }
    );
    return conferencesOutput;
  }
}
