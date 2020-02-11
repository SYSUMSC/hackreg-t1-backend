import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Moment } from 'moment';
import mongoose from 'mongoose';
import { RateLimiterAbstract, RateLimiterCluster } from 'rate-limiter-flexible';
import getAccessRateLimitingMiddleware from '../middleware/AccessRateLimitingMiddleware';
import getAuthMiddleware from '../middleware/AuthorizationMiddleware';
import getTimeAvailableCheckingMiddleware from '../middleware/TimeAvailableCheckingMiddleware';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import FormUpdateDto from '../user/FormUpdateDto';
import User from '../user/User';
import UserModel from '../user/UserModel';
import Controller from './Controller';

export interface SignupControllerConfig {
  publicKey: Buffer;
  limiterPoints: number;
  duration: number;
  startTime: Moment;
  endTime: Moment;
}

class SignupController implements Controller {
  public readonly router = express.Router();
  private readonly path = '/signup';
  private readonly config: SignupControllerConfig;
  private readonly signupRelatedLimiterByEmailAndIp: RateLimiterAbstract;
  private readonly accessRateLimitingMiddleware: express.RequestHandler;

  constructor(config: SignupControllerConfig) {
    this.config = config;
    this.signupRelatedLimiterByEmailAndIp = new RateLimiterCluster({
      storeClient: undefined,
      keyPrefix: 'signupRelatedLimiterByEmailAndIp',
      points: this.config.limiterPoints,
      duration: this.config.duration
    });
    this.accessRateLimitingMiddleware = getAccessRateLimitingMiddleware(
      this.signupRelatedLimiterByEmailAndIp,
      req => (req as express.Request & { user: User & mongoose.Document }).user.email
    );
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      `${this.path}/fetch`,
      getAuthMiddleware(this.config.publicKey),
      this.accessRateLimitingMiddleware,
      withUnhandledErrorBackup(this.fetch)
    );

    this.router.post(
      `${this.path}/update`,
      getTimeAvailableCheckingMiddleware(
        this.config.startTime,
        this.config.endTime,
        '报名尚未开始',
        '报名已经结束，不能再对报名表单做任何修改'
      ),
      getAuthMiddleware(this.config.publicKey),
      this.accessRateLimitingMiddleware,
      getValidationMiddleware(FormUpdateDto),
      withUnhandledErrorBackup(this.update)
    );
  }

  private fetch = async (
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) => {
    const user = (request as express.Request & {
      user: User & mongoose.Document;
    }).user;
    const userObj = user.toObject({ flattenMaps: true, versionKey: false });
    response.status(200).json(userObj);
  };

  private update = async (
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) => {
    const user = (request as express.Request & {
      user: User & mongoose.Document;
    }).user;
    const update = request.body as FormUpdateDto;
    await UserModel.findByIdAndUpdate(user._id, update);
    response.status(204).send();
  };
}

export default SignupController;
