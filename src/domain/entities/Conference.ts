import { ICreateId } from "../services/ICreateId";

export class ConferenceEntities {
  constructor(
    public conference: object,
    public email: string,
    public date: Date,
    public id: string,
    public created_at: Date,
    public updated_at: Date
  ) {}

  public static generateEntitie(
    conference: object,
    email: string,
    date: Date,
    createId: ICreateId
  ): ConferenceEntities {
    const id = createId.generateID();
    const now = new Date();

    const userEntities = new ConferenceEntities(
      conference,
      email,
      date,
      id,
      now,
      now
    );
    return userEntities;
  }

  public static createFromData(data: {
    conference: object;
    email: string;
    date: Date;
    id: string;
    created_at: Date | string;
    updated_at: Date | string;
  }): ConferenceEntities {
    const created_at =
      data.created_at instanceof Date
        ? data.created_at
        : new Date(data.created_at);
    const updated_at =
      data.updated_at instanceof Date
        ? data.updated_at
        : new Date(data.updated_at);

    return new ConferenceEntities(
      data.conference,
      data.email,
      data.date,
      data.id,
      created_at,
      updated_at
    );
  }

  public updateFields(data: Partial<ConferenceEntities>): void {
    if (!data.conference)
      throw new Error(
        "[Entities] updateFields value data.conference: " + data.conference
      );
    if (!data.email)
      throw new Error(
        "[Entities] updateFields value data.email: " + data.email
      );
    if (!data.date)
      throw new Error("[Entities] updateFields value data.date: " + data.email);
    this.conference = data.conference;
    this.date = data.date;
    this.email = data.email;
    this.updated_at = new Date();
  }
}
