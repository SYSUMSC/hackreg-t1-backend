import { NextFunction, Request, Response, Router, RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { Moment } from 'moment';
import mongoose from 'mongoose';
import { RateLimiterAbstract, RateLimiterCluster } from 'rate-limiter-flexible';
import getAccessRateLimitingMiddleware from '../middleware/accessRateLimit.middleware';
import getAuthMiddleware from '../middleware/auth.middleware';
import getTimeAvailableCheckingMiddleware from '../middleware/timeCheck.middleware';
import { withUnhandledErrorBackup } from '../middleware/unhandledErrors.middleware';
import getValidationMiddleware from '../middleware/validation.middleware';
import FormUpdateDto from '../account/dto/formUpdate.dto';
import User from '../account/type/user';
import UserModel from '../account/model/user.model';
import Controller from './base.controller';

export interface SignupControllerConfig {
  publicKey: Buffer;
  limiterPoints: number;
  duration: number;
  startTime: Moment;
  endTime: Moment;
}

class SignupController implements Controller {
  public readonly router = Router();
  private readonly path = '/signup';
  private readonly config: SignupControllerConfig;
  private readonly signupRelatedLimiterByEmailAndIp: RateLimiterAbstract;
  private readonly accessRateLimitingMiddleware: RequestHandler;

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
      req => (req as Request & { user: User & mongoose.Document }).user.email
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

  private fetch = async (request: Request, response: Response, next: NextFunction) => {
    const user = (request as Request & {
      user: User & mongoose.Document;
    }).user;
    const userObj = user.toObject({ flattenMaps: true, versionKey: false });
    response.status(200).json(userObj);
  };

  private update = async (request: Request, response: Response, next: NextFunction) => {
    const user = (request as Request & {
      user: User & mongoose.Document;
    }).user;
    const update = request.body as FormUpdateDto;
    await UserModel.findByIdAndUpdate(user._id, update);
    response.status(204).send();
  };
}

export default SignupController;
