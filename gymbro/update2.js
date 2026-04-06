const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/page.tsx',
  'app/workouts/page.tsx',
  'app/workouts/create/page.tsx',
  'app/workouts/manage/page.tsx',
  'app/progress/page.tsx',
  'app/coach/page.tsx',
];

const replacements = [
  { search: /\bbg-zinc-900(?![\/\-])/g, replace: 'bg-white dark:bg-zinc-900' },
  { search: /\bbg-zinc-900\/50\b/g, replace: 'bg-zinc-50/50 dark:bg-zinc-900/50' },
  { search: /\bbg-zinc-900\/80\b/g, replace: 'bg-zinc-50/80 dark:bg-zinc-900/80' },
  { search: /\bbg-zinc-950(?![\/\-])/g, replace: 'bg-zinc-50 dark:bg-zinc-950' },
  { search: /\bbg-zinc-950\/50\b/g, replace: 'bg-zinc-50/50 dark:bg-zinc-950/50' },
  { search: /\bborder-zinc-800(?![\/\-])/g, replace: 'border-zinc-200 dark:border-zinc-800' },
  { search: /\bborder-zinc-700(?![\/\-])/g, replace: 'border-zinc-300 dark:border-zinc-700' },
  { search: /\bbg-zinc-800(?![\/\-])/g, replace: 'bg-zinc-100 dark:bg-zinc-800' },
  { search: /\bbg-zinc-800\/50\b/g, replace: 'bg-zinc-100/50 dark:bg-zinc-800/50' },
  { search: /\bbg-zinc-800\/30\b/g, replace: 'bg-zinc-100/30 dark:bg-zinc-800/30' },
  { search: /\btext-zinc-200\b/g, replace: 'text-zinc-700 dark:text-zinc-200' },
  { search: /\btext-zinc-300\b/g, replace: 'text-zinc-600 dark:text-zinc-300' },
  { search: /\btext-zinc-400\b/g, replace: 'text-zinc-500 dark:text-zinc-400' },
  { search: /\btext-white\b/g, replace: 'text-zinc-900 dark:text-white' },
  { search: /\btext-zinc-100\b/g, replace: 'text-zinc-900 dark:text-zinc-100' },
  { search: /\bhover:bg-zinc-700(?![\/\-])/g, replace: 'hover:bg-zinc-200 dark:hover:bg-zinc-700' },
  { search: /\bhover:bg-zinc-800(?![\/\-])/g, replace: 'hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { search: /\bhover:text-zinc-200\b/g, replace: 'hover:text-zinc-800 dark:hover:text-zinc-200' },
  { search: /\bhover:text-zinc-100\b/g, replace: 'hover:text-zinc-900 dark:hover:text-zinc-100' },
  { search: /\bhover:text-white\b/g, replace: 'hover:text-black dark:hover:text-white' },
];

let changedCount = 0;
filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, (match, offset, string) => {
      const preceding = string.slice(Math.max(0, offset - 10), offset);
      const postceding = string.slice(offset, offset + match.length + 10);
      if (preceding.includes('dark:')) return match; 
      if (postceding.includes('dark:')) return match;
      if (preceding.includes('white') && match.includes('bg-white')) return match;
      return replace;
    });
  });

  // Fix buttons that became text-zinc-900
  content = content.replace(/bg-pink-600 text-zinc-900 dark:text-white/g, 'bg-pink-600 text-white');
  content = content.replace(/bg-pink-500 text-zinc-900 dark:text-white/g, 'bg-pink-500 text-white');
  content = content.replace(/bg-red-600 text-zinc-900 dark:text-white/g, 'bg-red-600 text-white');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  } else {
    console.log(`No changes made to ${file}`);
  }
});
console.log(`Finished. Total changed: ${changedCount}`);