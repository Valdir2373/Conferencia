import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { ConferenceEntities } from "../../domain/entities/Conference";
import { IConferenceRepository } from "../../domain/repository/IConferenceRepository";
import { IDataAccess } from "../../domain/repository/IDataAccess";

export class ConferenceRepository implements IConferenceRepository {
  private readonly collectionName = "conferences";
  private readonly selectFields: (keyof ConferenceEntities)[] = [
    "conference",
    "email",
    "id",
    "date",
    "created_at",
    "updated_at",
  ];

  constructor(private dataAcess: IDataAccess) {}
  async deleteConferenceById(id: string): Promise<number> {
    return await this.dataAcess.remove(this.collectionName, { id: id });
  }

  async updateConference(
    conferenceEntitie: ConferenceEntities
  ): Promise<ConferenceEntities | undefined> {
    const existingConference: ConferenceEntities | undefined =
      await this.getConferenceById(conferenceEntitie.id);

    if (existingConference) {
      existingConference.updateFields({
        email: conferenceEntitie.email,
        conference: conferenceEntitie.conference,
        date: conferenceEntitie.date,
      });

      const affectedRows = await this.dataAcess.update(
        this.collectionName,
        { id: existingConference.id },
        existingConference
      );

      if (affectedRows > 0) {
        return existingConference;
      }

      return undefined;
    } else {
      return undefined;
    }
  }
  async getConferenceById(id: string): Promise<ConferenceEntities | undefined> {
    const rawData = await this.dataAcess.findOne<ConferenceEntities>(
      this.collectionName,
      { id: id },
      this.selectFields
    );
    return rawData ? ConferenceEntities.createFromData(rawData) : undefined;
  }
  public async getConferenceByEmail(
    email: string
  ): Promise<ConferenceEntities[] | undefined> {
    return await this.dataAcess.findMany<ConferenceEntities>(
      this.collectionName,
      { email: email },
      this.selectFields
    );
  }
  public async createConference(
    conferenceEntities: ConferenceEntities
  ): Promise<ConferenceEntities | undefined> {
    const conference = await this.dataAcess.create(
      this.collectionName,
      conferenceEntities
    );
    if (conference !== undefined) return conferenceEntities;
    return undefined;
  }
}
