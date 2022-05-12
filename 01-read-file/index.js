require('fs')
  .createReadStream(require('path').join(__dirname, 'text.txt'))
  .pipe(process.stdout);
