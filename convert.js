const mdpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'PROJECT_OVERVIEW.md');
const pdfPath = path.join(__dirname, 'PROJECT_OVERVIEW.pdf');

// PDF styling options
const options = {
  paperFormat: 'A4',
  margin: {
    top: '20mm',
    bottom: '20mm',
    left: '20mm',
    right: '20mm'
  },
  cssPath: path.join(__dirname, 'pdf-styles.css'),
};

console.log('🔄 Converting PROJECT_OVERVIEW.md to PDF...');

const mdStream = fs.createReadStream(mdPath);
const pdfStream = fs.createWriteStream(pdfPath);

mdpdf(options).on('error', (err) => {
  console.error('❌ Error converting to PDF:', err);
  process.exit(1);
}).on('end', () => {
  console.log('✅ PDF created successfully!');
  console.log(`📄 Location: ${pdfPath}`);
  console.log(`📊 File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`);
}).pipe(pdfStream);

mdStream.pipe(mdpdf(options)).pipe(pdfStream);
