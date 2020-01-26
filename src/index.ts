import commandLineArgs from 'command-line-args';
import dotenv from 'dotenv';
import { bool, cleanEnv, host, num, port, str } from 'envalid';
import { readFileSync } from 'fs-extra';
import App from './App';
import { exsistingDir, minute } from './shared/CustomEnvValidator';

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
    TRUST_PROXY: str(),
    HOST: host(),
    PORT: port(),
    MONGODB: str(),
    PUBKEY: str(),
    PRIKEY: str(),
    PASSWORD_RESET_MAIL_DURATION: minute(),
    SMTP_HOST: str(),
    SMTP_PORT: port(),
    SMTP_SECURE: bool(),
    SMTP_USER: str(),
    SMTP_PASS: str(),
    UPLOAD_TEMP_DIR: exsistingDir(),
    UPLOAD_DIR: exsistingDir(),
    UPLOAD_FILE_SIZE_LIMIT: num(),
});

const publicKey = readFileSync(process.env.PUBKEY!);
const privateKey = readFileSync(process.env.PRIKEY!);
const app = new App({
    trustProxy: process.env.TRUST_PROXY!,
    host: process.env.HOST!,
    port: Number(process.env.PORT!),
    mongodb: process.env.MONGODB!,
    publicKey,
    privateKey,
    authControllerConfig: {
        privateKey,
        emailDuration: Number(process.env.PASSWORD_RESET_MAIL_DURATION!),
        smtpConfig: {
            host: process.env.SMTP_HOST!,
            port: Number(process.env.SMTP_PORT!),
            secure: Boolean(process.env.SMTP_SECURE!),
            auth: {
                user: process.env.SMTP_USER!,
                pass: process.env.SMTP_PASS!,
            },
        },
    },
    submitControllerConfig: {
        fileSizeLimit: Number(process.env.UPLOAD_FILE_SIZE_LIMIT!),
        tempDir: process.env.UPLOAD_TEMP_DIR!,
        dir: process.env.UPLOAD_DIR!,
        publicKey,
    }
});
app.init();
