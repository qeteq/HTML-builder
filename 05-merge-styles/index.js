const fs = require('fs');
const path = require('path');
const stream = require('stream');
const pipeline = require('util').promisify(stream.pipeline);

async function* enumerateDeepFiles(sourceFolder) {
  const dirs = [sourceFolder];
  while (dirs.length) {
    const dir = dirs.shift();
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        yield fullPath;
      }
      if (entry.isDirectory()) {
        dirs.push(fullPath);
      }
    }
  }
}

function ls(sourceFolder) {
  return stream.Readable.from(enumerateDeepFiles(sourceFolder));
}

async function* cat(filesIterable) {
  for await (const filename of filesIterable) {
    yield* fs.createReadStream(filename);
  }
}

async function* filter(iter, predicate) {
  for await (const x of iter) {
    if (predicate(x)) {
      yield x;
    }
  }
}

async function main() {
  const sourceFolder = path.join(__dirname, 'styles');
  const targetFile = path.join(__dirname, 'project-dist', 'bundle.css');
  const files = ls(sourceFolder);
  const cssFiles = filter(files, (f) => path.extname(f) === '.css');
  const bundle = cat(cssFiles);
  const out = fs.createWriteStream(targetFile);

  await pipeline(bundle, out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
