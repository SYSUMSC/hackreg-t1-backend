import fs from 'fs-extra';
import childProcess from 'child_process';

try {
    fs.removeSync('./dist');
    fs.copyFileSync('./env/production.env', './dist');
    childProcess.exec('tsc --build tsconfig.production.json');
} catch (err) {
    throw err;
}
