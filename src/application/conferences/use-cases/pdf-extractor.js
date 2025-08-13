const fs = require("fs/promises");
const pdf = require("pdf-parse");
const path = require("path");

async function extractAndCleanPDFText(pdfFilePath) {
  try {
    const dataBuffer = await fs.readFile(pdfFilePath);
    const data = await pdf(dataBuffer);
    let text = data.text;
    return TextFormatedProduct(text);
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw error;
  }
}

const TextFormatedProduct = (text) => {
  text = text.replace(/[0-9]/g, "");
  text = text.replace(/[^\w\s]/g, "");
  text = text.toUpperCase();
  const index = text.search("FATURA  DUPLICATA");
  text = text.slice(index, text.length);
  text = text.split("\n");
  const a = [];
  for (const txt of text) {
    if (
      txt &&
      txt !== "UN" &&
      txt !== "un" &&
      txt !== "KL" &&
      txt !== "kl" &&
      txt !== "FATURA  DUPLICATA"
    ) {
      if (
        txt ===
        "INSCRIO MUNICIPALVALOR TOTAL DOS SERVIOSBASE DE CLCULO DE ISSQNVALOR DO ISSQN"
      ) {
        return a;
      }
      a.push(txt);
    }
  }
};

const pdfExtractProducts = async (pdfFilePath) => {
  try {
    const cleanedText = await extractAndCleanPDFText(pdfFilePath);
    return cleanedText;
  } catch (err) {
    console.error("Erro no processamento:", err);
  }
};

module.exports = { pdfExtractProducts };
