#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { binaryAnchors, binaryErrors } from './binary-media.mjs';
import { pagePathFromFile } from './media-lib.mjs';

function main(args) {
  const pages = [];
  let manifestFile = 'tools/importer/media/media-manifest.json';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--manifest' && args[i + 1]) { manifestFile = args[i + 1]; i += 1; continue; }
    if (args[i] === '--pages') {
      while (args[i + 1] && !args[i + 1].startsWith('--')) {
        pages.push(args[i + 1]); i += 1;
      }
    } else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  if (!pages.length) throw new Error('At least one --pages <file> is required');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const results = pages.map((file) => {
    const html = readFileSync(file, 'utf8');
    return {
      page: path.resolve(file),
      binaries: binaryAnchors(html).length,
      errors: binaryErrors(html, manifest, pagePathFromFile(path.resolve(file))),
    };
  });
  console.log(JSON.stringify({ results }, null, 2));
  if (results.some((result) => result.errors.length)) process.exitCode = 1;
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
