// infra/pdf/PdfParserImpl.ts
import { IPdfReadConvert, Result } from "../../domain/services/IPdfReadConvert";
import pdf from "pdf-parse";

export class PdfParseImpl implements IPdfReadConvert {
  // Recebe o caminho do arquivo (string), não o Buffer.
  public async pdfToText(filePath: Buffer): Promise<Result> {
    try {
      // A biblioteca pdf-parse lerá o arquivo por conta própria.
      const data = await pdf(filePath);
      return data;
    } catch (error) {
      console.error("Erro ao converter PDF para texto:", error);
      throw new Error("Falha na conversão do arquivo PDF.");
    }
  }
}
