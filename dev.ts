import childProcess from 'child_process';
import fs from 'fs-extra';

console.log('cleaning up');
if (fs.pathExistsSync('./devdist')) {
  fs.rmdirSync('./devdist', { recursive: true });
}
fs.mkdirpSync('./devdist/env');
const files = ['env'];
files.forEach(file =>
  fs
    .readdirSync(`./${file}/`)
    .forEach(name => fs.copyFileSync(`./${file}/${name}`, `./devdist/${file}/${name}`))
);

console.log('compiling');
childProcess.execSync('tsc --build tsconfig.dev.json');

try {
  childProcess.execSync('pm2 stop hackreg-t1-worker hackreg-t1-rate-limiter', {
    cwd: './devdist'
  });
  console.log('stopped the running instances in pm2');
  childProcess.execSync('pm2 delete hackreg-t1-worker hackreg-t1-rate-limiter', {
    cwd: './devdist'
  });
  console.log('deleted the running instances in pm2');
} catch (error) {
  /* ignore */
}

console.log('starting pm2');
childProcess.execSync('pm2 start app.config.js --env development', {
  cwd: './devdist'
});
console.log("done, run 'pm2 monit' and keep it open!");
