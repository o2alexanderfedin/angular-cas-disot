const fs = require('fs');
const path = require('path');

// Read the lcov.info file
const lcovPath = path.join(__dirname, 'coverage/lcov.info');
const lcovContent = fs.readFileSync(lcovPath, 'utf8');

// Parse lcov data
const files = {};
let currentFile = null;

lcovContent.split('\n').forEach(line => {
  if (line.startsWith('SF:')) {
    currentFile = line.substring(3);
    files[currentFile] = {
      functions: { found: 0, hit: 0 },
      lines: { found: 0, hit: 0 },
      branches: { found: 0, hit: 0 }
    };
  } else if (currentFile) {
    if (line.startsWith('FNF:')) files[currentFile].functions.found = parseInt(line.substring(4));
    if (line.startsWith('FNH:')) files[currentFile].functions.hit = parseInt(line.substring(4));
    if (line.startsWith('LF:')) files[currentFile].lines.found = parseInt(line.substring(3));
    if (line.startsWith('LH:')) files[currentFile].lines.hit = parseInt(line.substring(3));
    if (line.startsWith('BRF:')) files[currentFile].branches.found = parseInt(line.substring(4));
    if (line.startsWith('BRH:')) files[currentFile].branches.hit = parseInt(line.substring(4));
  }
});

// Calculate coverage percentages and sort by lowest coverage
const fileCoverage = Object.entries(files)
  .map(([file, data]) => {
    const lineCoverage = data.lines.found > 0 ? (data.lines.hit / data.lines.found * 100) : 100;
    const functionCoverage = data.functions.found > 0 ? (data.functions.hit / data.functions.found * 100) : 100;
    const branchCoverage = data.branches.found > 0 ? (data.branches.hit / data.branches.found * 100) : 100;
    const avgCoverage = (lineCoverage + functionCoverage + branchCoverage) / 3;
    
    return {
      file: file.replace(/.*\/cas-app\//, ''),
      lineCoverage: lineCoverage.toFixed(1),
      functionCoverage: functionCoverage.toFixed(1),
      branchCoverage: branchCoverage.toFixed(1),
      avgCoverage: avgCoverage.toFixed(1),
      lines: data.lines,
      functions: data.functions,
      branches: data.branches
    };
  })
  .filter(item => item.avgCoverage < 80) // Show files with less than 80% average coverage
  .sort((a, b) => a.avgCoverage - b.avgCoverage);

console.log('Files with coverage < 80% (sorted by lowest coverage):');
console.log('======================================================');
fileCoverage.forEach(item => {
  console.log(`\n${item.file}`);
  console.log(`  Average: ${item.avgCoverage}%`);
  console.log(`  Lines: ${item.lineCoverage}% (${item.lines.hit}/${item.lines.found})`);
  console.log(`  Functions: ${item.functionCoverage}% (${item.functions.hit}/${item.functions.found})`);
  console.log(`  Branches: ${item.branchCoverage}% (${item.branches.hit}/${item.branches.found})`);
});

console.log('\n\nTop 5 files to improve for maximum impact:');
console.log('==========================================');
fileCoverage.slice(0, 5).forEach((item, index) => {
  console.log(`${index + 1}. ${item.file} (${item.avgCoverage}% avg coverage)`);
});