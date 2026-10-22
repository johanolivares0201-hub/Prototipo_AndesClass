import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
await mkdir('tmp/pdfs',{recursive:true});
await build({entryPoints:['scripts/report-example.ts'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'tmp/pdfs/report-example.mjs'});
await import(pathToFileURL(resolve('tmp/pdfs/report-example.mjs')).href);
