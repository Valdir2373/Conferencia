import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";

export class DeleteConferenceById {
  constructor(private conferenceRepository: IConferenceRepository) {}
  async execute(id: string): Promise<boolean> {
    const deletedConference =
      await this.conferenceRepository.deleteConferenceById(id);
    if (!deletedConference) return false;
    return true;
  }
}
