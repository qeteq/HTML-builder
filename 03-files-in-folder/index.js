const path = require('path');
const fs = require('fs/promises');

function formatSize(bytes) {
  const prefixes = ['', 'Ki', 'Mi', 'Gi', 'Ti'];
  let reduced = bytes;
  let i;
  for (i = 0; i < prefixes.length - 1; i++) {
    if (reduced >= 1000) {
      reduced /= 1024;
    } else {
      break;
    }
  }
  reduced = Math.round(reduced * 100) / 100;
  return `${reduced} ${prefixes[i]}B`;
}

async function main() {
  const folder = path.join(__dirname, 'secret-folder');
  const fileEntries = (
    await fs.readdir(folder, { withFileTypes: true })
  ).filter((f) => f.isFile());

  const stats = await Promise.all(
    fileEntries.map(async ({ name }) => ({
      name,
      stat: await fs.stat(path.join(folder, name)),
    }))
  );

  stats.forEach(({ name: fullName, stat }) => {
    const ext = path.extname(fullName);
    const size = stat.size;
    const name = ext.length > 0 ? fullName.slice(0, -ext.length) : fullName;
    console.log(`${name} - ${ext.slice(1) || 'N/A'} - ${formatSize(size)}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
