import dotenv from 'dotenv';
import commandLineArgs from 'command-line-args';
import { cleanEnv, str, port } from 'envalid';
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
    NODE_ENV: str({ choices: ['development', 'production'] }),
    PORT: port(),
});

const app = new App();
app.launch();
