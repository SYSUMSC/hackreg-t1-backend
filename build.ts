import childProcess from 'child_process';
import fs from 'fs-extra';

fs.removeSync('./dist');
fs.copyFileSync('./env/production.env', './dist');
childProcess.exec('tsc --build tsconfig.production.json');
