import { DeleteConferenceById } from "../../application/conferences/use-cases/DeleteConferenceById";
import { ConferenceEntities } from "../entities/Conference";

export interface IConferenceRepository {
  getConferenceByEmail(
    email: string
  ): Promise<ConferenceEntities[] | undefined>;
  createConference(
    conferenceEntities: ConferenceEntities
  ): Promise<ConferenceEntities | undefined>;
  getConferenceById(id: string): Promise<ConferenceEntities | undefined>;
  updateConference(
    conferenceEntities: ConferenceEntities
  ): Promise<ConferenceEntities | undefined>;
  deleteConferenceById(id: string): Promise<number>;
}
