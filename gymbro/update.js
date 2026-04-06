const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'gymbro/app/page.tsx',
  'gymbro/app/workouts/page.tsx',
  'gymbro/app/workouts/create/page.tsx',
  'gymbro/app/workouts/manage/page.tsx',
  'gymbro/app/progress/page.tsx',
  'gymbro/app/coach/page.tsx',
];

const replacements = [
  { search: /\bbg-zinc-900(?![\/\-])/g, replace: 'bg-white dark:bg-zinc-900' },
  { search: /\bbg-zinc-900\/50\b/g, replace: 'bg-white/50 dark:bg-zinc-900/50' },
  { search: /\bbg-zinc-900\/80\b/g, replace: 'bg-white/80 dark:bg-zinc-900/80' },
  { search: /\bborder-zinc-800(?![\/\-])/g, replace: 'border-zinc-200 dark:border-zinc-800' },
  { search: /\bborder-zinc-700(?![\/\-])/g, replace: 'border-zinc-300 dark:border-zinc-700' },
  { search: /\bbg-zinc-800(?![\/\-])/g, replace: 'bg-zinc-100 dark:bg-zinc-800' },
  { search: /\bbg-zinc-800\/50\b/g, replace: 'bg-zinc-100/50 dark:bg-zinc-800/50' },
  { search: /\bbg-zinc-800\/30\b/g, replace: 'bg-zinc-100/30 dark:bg-zinc-800/30' },
  { search: /\bbg-zinc-950(?![\/\-])/g, replace: 'bg-zinc-50 dark:bg-zinc-950' },
  { search: /\bbg-zinc-950\/50\b/g, replace: 'bg-zinc-50/50 dark:bg-zinc-950/50' },
  { search: /\btext-zinc-200\b/g, replace: 'text-zinc-800 dark:text-zinc-200' },
  { search: /\btext-zinc-300\b/g, replace: 'text-zinc-700 dark:text-zinc-300' },
  { search: /\btext-zinc-400\b/g, replace: 'text-zinc-500 dark:text-zinc-400' },
  { search: /\btext-white\b/g, replace: 'text-zinc-900 dark:text-white' },
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ search, replace }) => {
    // Only replace if it isn't already prefixed with dark:
    // This is a simple regex that assumes if the string is matched, we should check if it's already got dark:
    content = content.replace(search, (match, offset, string) => {
      const preceding = string.slice(Math.max(0, offset - 5), offset);
      if (preceding.includes('dark:') || preceding.includes('white') || preceding.includes('zinc-100')) {
        return match; // skip if we might have already replaced it inside another context, though our regexes are distinct.
        // Actually, simple regex might double replace if we run multiple times, but this script will only be run once.
      }
      return replace;
    });
  });

  // A tiny fix for "text-zinc-900 dark:text-white bg-pink-600 text-white" sort of double-replaces if 'text-white' was used for buttons.
  // Actually, for `bg-pink-600 text-white`, it turns into `bg-pink-600 text-zinc-900 dark:text-white` which might be bad on light mode (we want white text on pink button).
  // Let's do a post-process regex to fix `bg-pink-[0-9]+ text-zinc-900 dark:text-white` back to `text-white` if it's inside a pink element.
  content = content.replace(/bg-(pink|blue|red|green|purple)-([0-9]+)(\/[0-9]+)?(.*?)text-zinc-900 dark:text-white/g, 'bg-$1-$2$3$4text-white');
  content = content.replace(/text-zinc-900 dark:text-white(.*?)bg-(pink|blue|red|green|purple)-([0-9]+)/g, 'text-white$1bg-$2-$3');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes made to ${file}`);
  }
});
