import commandLineArgs from 'command-line-args';
import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';
import fs from 'fs-extra';
import App from './App';

const options = commandLineArgs([
    {
        name: 'env',
        defaultValue: 'production',
        type: String,
    },
]);

const { error } = dotenv.config({
    path: `./env/${options.env}.env`,
});
if (error) {
    throw error;
}
cleanEnv(process.env, {
    // TODO: add 'test' later
    NODE_ENV: str({ choices: ['development', 'production'] }),
    HOST: str(),
    PORT: port(),
    MONGODB: str(),
    PUBKEY: str(),
    PRIKEY: str(),
});

const app = new App({
    host: process.env.HOST!,
    port: Number(process.env.PORT!),
    mongodb: process.env.MONGODB!,
    publicKey: fs.readFileSync(process.env.PUBKEY!),
    privateKey: fs.readFileSync(process.env.PRIKEY!),
});
app.init();
