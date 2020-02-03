import commandLineArgs from 'command-line-args';
import dotenv from 'dotenv';
import { bool, cleanEnv, host, num, port, str } from 'envalid';
import { readFileSync } from 'fs-extra';
import App from './App';
import { exsistingDir, minute } from './shared/CustomEnvValidator';
import moment from 'moment';

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
    TRUST_PROXY: str(),
    HOST: host(),
    PORT: port(),
    MONGODB: str(),
    PUBKEY: str(),
    PRIKEY: str(),
    PASSWORD_RESET_MAIL_DURATION: minute(),
    LOGIN_LIMITER_BY_EMAIL_AND_IP_POINT: num(),
    LOGIN_LIMITER_BY_EMAIL_AND_IP_DURATION: num(),
    LOGIN_LIMITER_BY_IP_POINT: num(),
    LOGIN_LIMITER_BY_IP_DURATION: num(),
    AUTH_RELATED_LIMITER_BY_EMAIL_AND_IP_POINT: num(),
    AUTH_RELATED_LIMITER_BY_EMAIL_AND_IP_DURATION: num(),
    SIGNUP_RELATED_LIMITER_BY_EMAIL_AND_IP_POINT: num(),
    SIGNUP_RELATED_LIMITER_BY_EMAIL_AND_IP_DURATION: num(),
    SIGNUP_START_TIME: str(),
    SIGNUP_END_TIME: str(),
    SUBMIT_START_TIME: str(),
    SUBMIT_END_TIME: str(),
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
        emailTemplate: JSON.parse(readFileSync('./env/password_reset_mail_template.json').toString('UTF-8')),
        loginLimiterByEmailAndIpPoints: Number(process.env.LOGIN_LIMITER_BY_EMAIL_AND_IP_POINT!),
        loginLimiterByEmailAndIpDuration: Number(process.env.LOGIN_LIMITER_BY_EMAIL_AND_IP_DURATION!),
        loginLimiterByIpPoints: Number(process.env.LOGIN_LIMITER_BY_IP_POINT!),
        loginLimiterByIpDuration: Number(process.env.LOGIN_LIMITER_BY_IP_DURATION!),
        authRelatedLimiterByEmailAndIpPoints: Number(process.env.AUTH_RELATED_LIMITER_BY_EMAIL_AND_IP_POINT!),
        authRelatedLimiterByEmailAndIpDuration: Number(process.env.AUTH_RELATED_LIMITER_BY_EMAIL_AND_IP_DURATION!),
    },
    signupControllerConfig: {
        publicKey,
        limiterPoints: Number(process.env.SIGNUP_RELATED_LIMITER_BY_EMAIL_AND_IP_POINT!),
        duration: Number(process.env.SIGNUP_RELATED_LIMITER_BY_EMAIL_AND_IP_DURATION!),
        startTime: moment(process.env.SIGNUP_START_TIME!),
        endTime: moment(process.env.SIGNUP_END_TIME!),
    },
    submitControllerConfig: {
        fileSizeLimit: Number(process.env.UPLOAD_FILE_SIZE_LIMIT!),
        tempDir: process.env.UPLOAD_TEMP_DIR!,
        dir: process.env.UPLOAD_DIR!,
        publicKey,
        startTime: moment(process.env.SUBMIT_START_TIME!),
        endTime: moment(process.env.SUBMIT_END_TIME!),
    },
});
app.init();
