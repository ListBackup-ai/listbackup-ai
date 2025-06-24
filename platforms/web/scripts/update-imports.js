#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define import mappings
const importMappings = [
  // Utils
  { from: /@\/lib\/utils/g, to: '@listbackup/shared/utils' },
  
  // API imports
  { from: /@\/lib\/api/g, to: '@listbackup/shared/api' },
  { from: /@\/lib\/api\/(\w+)/g, to: '@listbackup/shared/api/$1' },
  
  // Types
  { from: /@\/types\/(\w+)/g, to: '@listbackup/shared/types/$1' },
  { from: /@\/types/g, to: '@listbackup/shared/types' },
];

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**'],
  cwd: path.join(__dirname, '..')
});

console.log(`Found ${files.length} files to process`);

let updatedFiles = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  importMappings.forEach(mapping => {
    if (mapping.from.test(content)) {
      content = content.replace(mapping.from, mapping.to);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    updatedFiles++;
    console.log(`✓ Updated: ${file}`);
  }
});

console.log(`\nCompleted! Updated ${updatedFiles} files.`);