import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

function resolveFrom(fromFile, relativePath) {
  return path.resolve(path.dirname(fromFile), relativePath);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(p) {
  return fs.readFile(p, 'utf8');
}

/**
 * Simple include processor.
 * Replaces: <!-- @include ./relative/file.html -->
 */
async function inlineIncludes(templatePath, { maxDepth = 10 } = {}) {
  let html = await readUtf8(templatePath);

  const includeRe = /^\s*<!--\s*@include\s+(.+?)\s*-->\s*$/gm;
  for (let depth = 0; depth < maxDepth; depth++) {
    let didReplace = false;

    html = await replaceAsync(html, includeRe, async (_match, includePathRaw) => {
      didReplace = true;
      const includePath = includePathRaw.trim().replace(/^["']|["']$/g, '');
      const abs = resolveFrom(templatePath, includePath);

      if (!(await fileExists(abs))) {
        throw new Error(`Missing include file: ${abs}`);
      }

      const included = await readUtf8(abs);
      return included.replace(/\r\n/g, '\n');
    });

    if (!didReplace) break;
  }

  return html;
}

async function replaceAsync(str, re, asyncFn) {
  const matches = [];
  str.replace(re, (...args) => {
    const match = args[0];
    const offset = args[args.length - 2];
    matches.push({ match, offset, args });
    return match;
  });

  if (!matches.length) return str;

  let result = '';
  let lastIndex = 0;
  for (const m of matches) {
    const replacement = await asyncFn(...m.args);
    result += str.slice(lastIndex, m.offset) + replacement;
    lastIndex = m.offset + m.match.length;
  }
  result += str.slice(lastIndex);
  return result;
}

async function main() {
  const srcHtml = path.join(ROOT, 'src/pages/head-coach-pitch/head-coach-pitch.html');
  const outHtml = path.join(ROOT, 'head-coach-pitch.html');
  const srcJs = path.join(ROOT, 'src/pages/head-coach-pitch/head-coach-pitch.js');
  const outJs = path.join(ROOT, 'head-coach-pitch.js');

  const built = await inlineIncludes(srcHtml);
  const banner = [
    '<!--',
    '  GENERATED FILE — DO NOT EDIT DIRECTLY',
    '  Source: src/pages/head-coach-pitch/head-coach-pitch.html',
    '  Build:  npm run build',
    '-->',
    ''
  ].join('\n');

  await fs.writeFile(outHtml, (banner + built).replace(/\r\n/g, '\n'));

  if (await fileExists(srcJs)) {
    const js = await readUtf8(srcJs);
    await fs.writeFile(outJs, js.replace(/\r\n/g, '\n'));
  }

  // eslint-disable-next-line no-console
  console.log('Built:', path.relative(ROOT, outHtml), path.relative(ROOT, outJs));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

