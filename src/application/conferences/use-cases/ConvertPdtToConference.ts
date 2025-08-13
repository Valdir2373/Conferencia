import { PdfFileMetadata } from "../DTO/PdfFileMetadata";
import { pdfExtractProducts } from "./pdf-extractor";

export class ConvertPdtToConference {
  async execute(pdfFile: PdfFileMetadata) {
    try {
      const data = await pdfExtractProducts(pdfFile.path);
      return data;
    } catch (error) {
      console.error("Erro ao converter PDF para texto:", error);
      throw new Error("Falha na conversão do arquivo PDF.");
    }
  }
}
