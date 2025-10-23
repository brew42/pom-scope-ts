#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parsePom, formatDepsTable } from './lib';

const argv = yargs(hideBin(process.argv))
  .usage('$0 -f <path/to/pom.xml> [--format table|json]')
  .option('f', { alias: 'file', type: 'string', demandOption: true, describe: 'Path to pom.xml' })
  .option('format', { type: 'string', default: 'table', choices: ['table', 'json'] as const })
  .help()
  .parseSync();

const pomPath = path.resolve(argv.f);
if (!fs.existsSync(pomPath)) {
  console.error(`File not found: ${pomPath}`);
  process.exit(1);
}

const xml = fs.readFileSync(pomPath, 'utf8');
const deps = parsePom(xml);

if (argv.format === 'json') {
  console.log(JSON.stringify(deps, null, 2));
} else {
  console.log(formatDepsTable(deps));
}
