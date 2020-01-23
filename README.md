WIP

Steps to build dev environment:
1. `git clone https://github.com/SYSUMSC/hackreg-t1-backend.git`
2. `cd hackreg-t1-backend`
3. `npm install`
4. Run `ssh-keygen` to generate a RSA SHA256 key pair called `hackreg-dev`, move them into `env` folder
5. Prepare your own mongodb server, edit related settings in `env/development.env`

Command to run in dev environment:

`npm run dev`

Command to build production codes:

`npm run build`