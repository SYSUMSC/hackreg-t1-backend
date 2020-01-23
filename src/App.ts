import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import { Application } from 'express';
import createHttpError from 'http-errors';
import mongoose, { ConnectionOptions } from 'mongoose';
import AuthController from './controller/AuthController';
import IController from './controller/IController';
import SignupController from './controller/SignupFormController';
import unhandledErrorsBackup from './middleware/UnhandledErrorsBackup';
import { logger } from './shared/Logger';

interface IAppConfig {
    host: string;
    port: number;
    mongodb: string;
    privateKey: Buffer;
    publicKey: Buffer;
}

const MONGO_OPTIONS: ConnectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
};

const JSON_OPTIONS: OptionsJson = {
    limit: '1kb',
};

const URLENCODED_OPTIONS: OptionsUrlencoded = {
    extended: true,
    limit: '1kb', // TODO
    parameterLimit: 20,
};

class App {
    private readonly app: Application;
    private readonly config: IAppConfig;
    private readonly controllers: IController[];

    constructor(config: IAppConfig) {
        this.app = express();
        this.config = config;
        this.controllers = [
            new SignupController(),
            new AuthController(),
        ];
    }

    private initMiddlewares() {
        this.app.use(express.json(JSON_OPTIONS));
        this.app.use(express.urlencoded(URLENCODED_OPTIONS));
        this.app.use(cookieParser());
    }

    private initControllers() {
        this.controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
        this.app.all(`*`, (_, __, next) => next(createHttpError(400, '请求的方法或路径无效')));
    }

    private initErrorHandlers() {
        this.app.use(unhandledErrorsBackup);
    }

    public async init() {
        logger.info('Connecting database');
        await mongoose.connect(this.config.mongodb, MONGO_OPTIONS);
        mongoose.connection.on('error', logger.error.bind(logger));

        logger.info('Initializing middlewares & controllers');
        this.initMiddlewares();
        this.initControllers();
        this.initErrorHandlers();

        await new Promise((resolve, reject) => {
            try {
                if (this.config.host.startsWith('/')) {
                    logger.info(`Server is now listening ${this.config.host}`);
                    this.app.listen(this.config.host, () => resolve());
                } else {
                    logger.info(`Server is now listening ${this.config.host}:${this.config.port}`);
                    this.app.listen(this.config.port, this.config.host, () => resolve());
                }
            } catch (e) {
                reject(e);
            }
        });

        logger.info('Successfully launched the app!');
    }
}

export default App;
