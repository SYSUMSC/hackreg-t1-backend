import { OptionsJson } from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import { Application } from 'express';
import helmet from 'helmet';
import createHttpError from 'http-errors';
import moment from 'moment';
import mongoose, { ConnectionOptions } from 'mongoose';
import morgan from 'morgan';
import AuthController, { AuthControllerConfig } from './controller/AuthController';
import Controller from './controller/Controller';
import SignupController, { SignupControllerConfig } from './controller/SignupController';
import SubmitController, { SubmitControllerConfig } from './controller/SubmitController';
import unhandledErrorsBackup, { DATE_FORMAT } from './middleware/UnhandledErrorsBackup';

interface AppConfig {
  trustProxy: string;
  host: string;
  port: number;
  mongodb: string;
  authControllerConfig: AuthControllerConfig;
  signupControllerConfig: SignupControllerConfig;
  submitControllerConfig: SubmitControllerConfig;
}

const MONGO_OPTIONS: ConnectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: false,
  useFindAndModify: false
};

const JSON_OPTIONS: OptionsJson = {
  limit: '8kb'
};

class App {
  private readonly app: Application;
  private readonly config: AppConfig;
  private readonly controllers: Controller[];

  constructor(config: AppConfig) {
    this.app = express();
    this.config = config;
    this.controllers = [
      new SignupController(this.config.signupControllerConfig),
      new AuthController(this.config.authControllerConfig),
      new SubmitController(this.config.submitControllerConfig)
    ];
    this.app.set('trust proxy', this.config.trustProxy);
  }

  private initMiddlewares() {
    morgan.token('date_', () => moment().format());
    morgan.format(
      'hackreg',
      ':remote-addr [:date_] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    );
    this.app.use(morgan('hackreg'));
    this.app.use(helmet({ noCache: true, hidePoweredBy: true }));
    this.app.use(express.json(JSON_OPTIONS));
    this.app.use(cookieParser());
  }

  private initControllers() {
    this.controllers.forEach(controller => {
      this.app.use('/', controller.router);
    });
    this.app.all('*', (request, _, next) => {
      if (!request.route) {
        next(createHttpError(400, '请求的方法或路径无效'));
      }
    });
  }

  private initErrorHandlers() {
    this.app.use(unhandledErrorsBackup);
  }

  public async init() {
    console.info('Connecting to database');
    await mongoose.connect(this.config.mongodb, MONGO_OPTIONS);
    mongoose.connection.on('error', error => {
      console.error(`Database errored at ${moment().format(DATE_FORMAT)}`);
      console.error(error);
    });

    console.info('Initializing middlewares & controllers');
    this.initMiddlewares();
    this.initControllers();
    this.initErrorHandlers();

    await new Promise((resolve, reject) => {
      try {
        if (this.config.host.startsWith('/')) {
          console.info(`Server is now running at ${this.config.host}`);
          this.app.listen(this.config.host, () => resolve());
        } else {
          console.info(`Server is now running at ${this.config.host}:${this.config.port}`);
          this.app.listen(this.config.port, this.config.host, () => resolve());
        }
      } catch (e) {
        reject(e);
      }
    });

    console.info('Successfully launched the app!');
  }
}

export default App;
