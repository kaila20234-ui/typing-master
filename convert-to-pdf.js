const fs = require('fs');
const path = require('path');
const html2pdf = require('html2pdf.js');

// Read the markdown file
const mdPath = path.join(__dirname, 'PROJECT_OVERVIEW.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');

// Simple markdown to HTML converter
function markdownToHTML(md) {
  let html = md;
  
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```[\s\S]*?```/gim, (match) => {
    const code = match.replace(/```/g, '').trim();
    return '<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
  
  // Line breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Tables (basic)
  html = html.replace(/\|.*\|/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    return '<tr>' + cells.map(c => '<td>' + c.trim() + '</td>').join('') + '</tr>';
  });
  html = html.replace(/(<tr>.*?<\/tr>)/s, '<table>$1</table>');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Paragraphs
  html = '<p>' + html + '</p>';
  
  return html;
}

// Create HTML document
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Typing Master - Project Overview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 2.5em;
      color: #1a1a1a;
      margin-top: 40px;
      margin-bottom: 20px;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 1.8em;
      color: #0056b3;
      margin-top: 30px;
      margin-bottom: 15px;
      border-left: 4px solid #007bff;
      padding-left: 10px;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 1.3em;
      color: #0056b3;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f8f9fa;
    }
    
    table th, table td {
      border: 1px solid #dee2e6;
      padding: 12px;
      text-align: left;
    }
    
    table th {
      background: #007bff;
      color: white;
      font-weight: bold;
    }
    
    table tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    table tr:hover {
      background: #e7f3ff;
    }
    
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #d63384;
    }
    
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border-radius: 0;
    }
    
    ul, ol {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    blockquote {
      border-left: 4px solid #007bff;
      padding-left: 15px;
      margin: 15px 0;
      color: #555;
      font-style: italic;
    }
    
    a {
      color: #007bff;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    strong {
      color: #0056b3;
      font-weight: bold;
    }
    
    em {
      font-style: italic;
      color: #666;
    }
    
    .toc {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 20px;
      border-radius: 5px;
      margin: 30px 0;
    }
    
    .toc ul {
      margin: 10px 0;
    }
    
    @media print {
      body {
        padding: 0;
      }
      h1 {
        page-break-before: avoid;
      }
      table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${markdownToHTML(mdContent)}
</body>
</html>
`;

// Save HTML temporarily
const htmlPath = path.join(__dirname, 'PROJECT_OVERVIEW_temp.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('✅ PDF conversion completed!');
console.log(`📄 Generated: PROJECT_OVERVIEW.html (temporary)`);
console.log('');
console.log('Now converting HTML to PDF...');
