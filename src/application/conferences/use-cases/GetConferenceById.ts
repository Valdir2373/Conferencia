import { ConferenceEntities } from "../../../domain/entities/Conference";
import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";

export class GetConferenceById {
  constructor(private conferenceRepository: IConferenceRepository) {}
  async execute(id: string): Promise<ConferenceEntities | undefined> {
    return this.conferenceRepository.getConferenceById(id);
  }
}
