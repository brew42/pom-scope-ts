#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import isPathInside from 'is-path-inside';
import { parsePom, formatDepsTable } from './lib';

const argv = yargs(hideBin(process.argv))
  .usage('$0 -f <path/to/pom.xml> [--format table|json]')
  .option('f', {
    alias: 'file',
    type: 'string',
    demandOption: true,
    describe: 'Path to pom.xml (must be inside the current directory)',
  })
  .option('format', {
    type: 'string',
    default: 'table',
    choices: ['table', 'json'],
  })
  .help()
  .strict()
  .parseSync();

const baseDir = process.cwd();

// Normalize and resolve the user-supplied path
const candidatePath = path.resolve(baseDir, path.normalize(argv.f));

// Check that it stays within the base directory
if (!isPathInside(candidatePath, baseDir)) {
  console.error('Path traversal detected. File must be inside the current directory.');
  process.exit(1);
}

if (!candidatePath.endsWith('.xml')) {
  console.error('Invalid file type. Expected a .xml file.');
  process.exit(1);
}

if (!fs.existsSync(candidatePath)) {
  console.error(`File not found: ${candidatePath}`);
  process.exit(1);
}

const xml = fs.readFileSync(candidatePath, 'utf8');
const deps = parsePom(xml);

if (argv.format === 'json') {
  console.log(JSON.stringify(deps, null, 2));
} else {
  console.log(formatDepsTable(deps));
}
