import fs from "fs/promises";
import path from "path";

export class ConvertFileTxtById {
  constructor() {}
  async execute(text: string) {
    const filePath = await this.createArchiveTxt(text);
    return filePath;
  }

  private async createArchiveTxt(text: string) {
    const fileName = `conference.txt`;
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "uploads",
      fileName
    );

    await fs.writeFile(filePath, text, "utf-8");
    console.log("Arquivo criado em:", filePath);
    return filePath;
  }
}
