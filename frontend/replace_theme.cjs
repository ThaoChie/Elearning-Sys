const fs = require('fs');
const path = require('path');

const replacements = [
  ['text-slate-100', 'text-slate-800'],
  ['text-slate-200', 'text-slate-700'],
  ['text-slate-300', 'text-slate-600'],
  ['text-slate-400', 'text-slate-500'],
  ['bg-slate-800/30', 'bg-white/60'],
  ['bg-slate-800/40', 'bg-white/70'],
  ['bg-slate-800/50', 'bg-white/80'],
  ['bg-slate-800', 'bg-white'],
  ['bg-slate-900/50', 'bg-slate-50/50'],
  ['bg-slate-900', 'bg-slate-50'],
  ['border-slate-700/30', 'border-slate-200/50'],
  ['border-slate-700/50', 'border-slate-200/50'],
  ['border-slate-700', 'border-slate-200'],
  ['text-white', 'text-slate-900'],
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const [from, to] of replacements) {
        newContent = newContent.split(from).join(to);
      }
      // Special fix: button text might want to stay white if bg is blue
      newContent = newContent.replace(/bg-indigo-600 hover:bg-indigo-500 text-slate-900/g, 'bg-indigo-600 hover:bg-indigo-500 text-white');
      newContent = newContent.replace(/bg-blue-600 text-slate-900/g, 'bg-blue-600 text-white');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir('src');
console.log('Done');
