import { ConferenceEntities } from "../../../domain/entities/Conference";
import { IConferenceRepository } from "../../../domain/repository/IConferenceRepository";

export class ConvertConferenceInText {
  constructor(private conferenceRepository: IConferenceRepository) {}
  async execute(id: string) {
    console.log(id);

    const conferenceEntities =
      await this.conferenceRepository.getConferenceById(id);
    if (!conferenceEntities) throw new Error("conference not found");

    const text = this.createText(conferenceEntities);
    return text;
  }
  private createText(data: ConferenceEntities) {
    const { conference, date } = data;
    const d = new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    let listProduct = "Todos os produtos do dia " + d + " :\n \n";
    Object.keys(conference).forEach((key) => {
      const cleanKey = key.trim();
      listProduct += `Produto: ${cleanKey}, Quantidade: ${data.conference[key]}\n`;
    });

    return listProduct;
  }
}
