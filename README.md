# hackreg-t1-backend
🤟The backend program for Hackathon 2020 registration website.

## Technology Stack
- PM2
- Mongodb
- Express.js
- TypeScript

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and tell you how to deploy the project on a live system.

#### Setting up local development environment
1. Run these commands to fetch the copy of the project and install the dependent packages using npm.
    ```
    git clone https://github.com/SYSUMSC/hackreg-t1-backend.git
    cd hackreg-t1-backend
    npm install
    ```
2. Open `env/development.env`, and refer to the comments to set up mongodb and RSA SHA256 key pair.
3. Install pm2 globally: `npm install pm2 -g`.
4. Run these commands to fire up the development build! Tips: With the help of nodemon, a recompile will automatically be executed whenever there are file changes in `src/` and `env/`.
    ```
    npm run dev
    ```

#### Making a production build and run it
1. Run `npm run build`.
2. Copy the `dist/` to wherever you want.
3. Prepare a new RSA SHA256 key pair and edit `env/production.env` accordingly.
4. Run `npm install -g pm2` to install pm2 globally.
5. Run `pm2 start app.config.js` to fire up the server!
6. For deployment, it is strongly recommended to use a reverse proxy.

## Documention
Check out the wiki [here](https://github.com/SYSUMSC/hackreg-t1-backend/wiki/).

## License
This project is licensed under the [MIT license](https://opensource.org/licenses/mit-license.php), see the LICENSE file for details
