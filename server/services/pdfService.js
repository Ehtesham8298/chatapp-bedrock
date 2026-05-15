const pdfParse = require('pdf-parse');

async function parsePDF(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
    };
  } catch (err) {
    console.error('PDF parse error:', err);
    throw new Error('Failed to parse PDF file');
  }
}

module.exports = { parsePDF };
