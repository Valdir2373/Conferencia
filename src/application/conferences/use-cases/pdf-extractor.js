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
  text = text.replace(/\s*\(.*?\)\s*/gs, " ").trim();
  text = text.replace(/[^\w\s(),]/g, "");
  text = text.toUpperCase();

  const index = text.search("FATURA  DUPLICATA");

  const slicedText = text.slice(index, text.length);
  const lines = slicedText.split("\n");
  const textFormated = formatePhrase_ALF(lines);

  const lista = [];
  const regexAbertura = /\s*\(.+/;
  const regexFechamento = /.+?\)/;

  for (const txt of textFormated) {
    if (
      txt &&
      txt !== "UN" &&
      txt !== "KL" &&
      txt !== "kl" &&
      txt !== "020" &&
      txt !== "040" &&
      txt !== "FATURA  DUPLICATA" &&
      !txt.includes(",000,000")
    ) {
      if (
        txt ===
          "INSCRIO MUNICIPALVALOR TOTAL DOS SERVIOSBASE DE CLCULO DE ISSQNVALOR DO ISSQN" ||
        txt === "CLCULO DO ISSQN"
      ) {
        return lista;
      }
      let txtLimpado = txt;
      if (txt.includes("(")) {
        txtLimpado = txt.replace(regexAbertura, "").trim();
      }
      if (txt.includes(")")) {
        txtLimpado = txt.replace(regexFechamento, "").trim();
      }
      lista.push(txtLimpado);
    }
  }

  return a;
};
const formatePhrase_ALF = (textToFormate) => {
  const textFormated = textToFormate.map((item) => {
    if (typeof item === "string") {
      let newItem = item;
      return newItem;
    }
    return item;
  });

  return textFormated;
};

const pdfExtractProducts = async (pdfFilePath) => {
  try {
    const cleanedText = await extractAndCleanPDFText(pdfFilePath);
    await fs.rm(pdfFilePath);
    return cleanedText;
  } catch (err) {
    console.error("Erro no processamento:", err);
  }
};

module.exports = { pdfExtractProducts };
