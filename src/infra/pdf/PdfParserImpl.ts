import { IPdfReadConvert, Result } from "./IPdfReadConvert";
import pdf from "pdf-parse";

export class PdfParseImpl implements IPdfReadConvert {
  public async pdfToText(filePath: Buffer): Promise<Result> {
    try {
      const data = await pdf(filePath);
      return data;
    } catch (error) {
      console.error("Erro ao converter PDF para texto:", error);
      throw new Error("Falha na conversão do arquivo PDF.");
    }
  }
}
