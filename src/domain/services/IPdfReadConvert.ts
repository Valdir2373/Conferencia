export interface Result {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  text: string;
}

export interface IPdfReadConvert {
  pdfToText(dataBuffer: Buffer): Promise<Result>;
}
