const http = require('http');
const fs = require('fs');
const { resolve } = require('path');
const yargs = require('yargs');

const host = '192.168.0.106';
const port = 3011;

const { argv: { index, name, path } } = yargs
  .option('index', {
    alias: 'i',
    default: 0,
    description: 'select file index',
  })
  .option('name', {
    alias: 'n',
    description: 'file name',
  })
  .option('path', {
    alias: 'p',
    default: '.',
    description: 'save file path',
  });

const fetchFileList = () => new Promise((next) => {
  const req = http.request({
    method: 'GET',
    host,
    port,
    path: '/sunlandfile/api/files?page=0&pageSize=20&orderBy=createTime&sort=-1',
  });
  req.on('response', (res) => {
    const buf = [];
    res.on('data', (chunk) => {
      buf.push(chunk);
    });
    res.on('end', () => {
      next(JSON.parse(Buffer.concat(buf)).list);
    });
  });
  req.end();
});

const download = (id) => {
  const req = http.request({
    method: 'GET',
    host,
    port,
    path: `/sunlandfile/preview/${id}`,
  });

  req.on('response', (res) => {
    const saveTo = resolve(process.cwd(), path, name || id);
    const stream = fs.createWriteStream(saveTo);
    res.pipe(stream);
    stream.on('finish', () => {
      console.log(`download file to ${saveTo}`);
    });
  });

  req.end();
};

fetchFileList()
  .then((list) => {
    const item = list[index];
    if (item) {
      return item;
    }
    return Promise.reject(new Error('file is not exist'));
  })
  .then(({ _id }) => {
    download(_id);
  });
