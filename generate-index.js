const fs = require('fs');
const path = require('path');

// Directory containing your markdown files
const markdownDir = path.join(__dirname, 'markdown');

// Get all markdown files
const markdownFiles = fs.readdirSync(markdownDir)
  .filter(file => file.endsWith('.md'))
  .map(filename => {
    const filePath = path.join(markdownDir, filename);
    const stats = fs.statSync(filePath);
    
    return {
      filename,
      date: stats.mtime.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };
  })
  // Sort by date (newest first)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Write the file index to a JSON file
fs.writeFileSync(
  path.join(__dirname, 'markdown-list.json'),
  JSON.stringify(markdownFiles, null, 2)
);

console.log(`Generated index with ${markdownFiles.length} markdown files`);