import childProcess from 'child_process';
import fs from 'fs-extra';

if (fs.pathExistsSync('./dist')) {
  fs.rmdirSync('./dist', { recursive: true });
}
fs.mkdirpSync('./dist/env');
const files = ['env'];
files.forEach(file =>
  fs
    .readdirSync(`./${file}/`)
    .filter(name => !name.includes('development'))
    .forEach(name => fs.copyFileSync(`./${file}/${name}`, `./dist/${file}/${name}`))
);

childProcess.exec('tsc --build tsconfig.prod.json');
