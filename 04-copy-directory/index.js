const path = require('path');
const fs = require('fs/promises');

const { flow, ls, filter, map } = require('../lib/streamutils');

async function safeCopy(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  return await fs.copyFile(sourcePath, targetPath);
}

async function syncFolders(sourceDir, targetDir) {
  const promises = [];

  await fs.rm(targetDir, { recursive: true, force: true });

  const getFilenames = flow(
    ls({ recursive: true }),
    filter(({ dirent }) => dirent.isFile()),
    map(({ filename }) => filename)
  );

  for await (const filename of getFilenames(sourceDir)) {
    const relPath = path.relative(sourceDir, filename);
    const targetPath = path.join(targetDir, relPath);
    promises.push(safeCopy(filename, targetPath));
  }

  await Promise.all(promises);
}

async function main() {
  const sourceDir = path.join(__dirname, 'files');
  const targetDir = path.join(__dirname, 'files-copy');
  await syncFolders(sourceDir, targetDir);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

exports.syncFolders = syncFolders;
