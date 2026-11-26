import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findHtmlFiles(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) {
      findHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: findHtmlFiles(resolve(fileURLToPath(new URL('.', import.meta.url))))
    }
  }
});
