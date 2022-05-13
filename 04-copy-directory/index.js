const path = require('path');
const fs = require('fs/promises');

/**
 * @param {string} folder
 */
async function* enumerateDeepFiles(sourceFolder) {
  const dirs = [sourceFolder];
  while (dirs.length) {
    const dir = dirs.shift();
    const entries = await fs.readdir(dir, { withFileTypes: true });
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

async function safeCopy(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  return await fs.copyFile(sourcePath, targetPath);
}

async function syncFolders(sourceDir, targetDir) {
  const promises = [];

  await fs.rm(targetDir, { recursive: true, force: true });

  for await (const sourcePath of enumerateDeepFiles(sourceDir)) {
    const relPath = path.relative(sourceDir, sourcePath);
    const targetPath = path.join(targetDir, relPath);
    promises.push(safeCopy(sourcePath, targetPath));
  }

  await Promise.all(promises);
}

async function main() {
  const sourceDir = path.join(__dirname, 'files');
  const targetDir = path.join(__dirname, 'files-copy');
  await syncFolders(sourceDir, targetDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
