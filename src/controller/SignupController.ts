import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { RateLimiterAbstract, RateLimiterCluster } from 'rate-limiter-flexible';
import getAccessRateLimitingMiddleware from '../middleware/AccessRateLimitingMiddleware';
import getAuthMiddleware from '../middleware/AuthorizationMiddleware';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import FormUpdateDto from '../user/FormUpdateDto';
import IUser from '../user/IUser';
import UserModel from '../user/UserModel';
import IController from './IController';

export interface ISignupControllerConfig {
    publicKey: Buffer;
    limiterPoints: number;
    duration: number;
}

class SignupController implements IController {
    public readonly router = express.Router();
    private readonly path = '/signup';
    private readonly config: ISignupControllerConfig;
    private readonly signupRelatedLimiterByEmailAndIp: RateLimiterAbstract;
    private readonly accessRateLimitingMiddleware: express.RequestHandler;

    constructor(config: ISignupControllerConfig) {
        this.config = config;
        this.signupRelatedLimiterByEmailAndIp = new RateLimiterCluster({
            storeClient: undefined,
            keyPrefix: 'signupRelatedLimiterByEmailAndIp',
            points: this.config.limiterPoints,
            duration: this.config.duration,
        });
        this.accessRateLimitingMiddleware = getAccessRateLimitingMiddleware​​(this.signupRelatedLimiterByEmailAndIp, (req) => (req as express.Request & { user: IUser & mongoose.Document }).user.email);
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/fetch`,
                        getAuthMiddleware(this.config.publicKey),
                        this.accessRateLimitingMiddleware,
                        withUnhandledErrorBackup(this.fetch));

        this.router.post(`${this.path}/update`,
                         getAuthMiddleware(this.config.publicKey),
                         this.accessRateLimitingMiddleware,
                         getValidationMiddleware(FormUpdateDto),
                         withUnhandledErrorBackup(this.update));

        this.router.post(`${this.path}/cancel`,
                         getAuthMiddleware(this.config.publicKey),
                         this.accessRateLimitingMiddleware,
                         withUnhandledErrorBackup(this.cancel));
    }

    private fetch = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const user = (request as express.Request & { user: IUser & mongoose.Document }).user;
        const userObj = user.toObject({ flattenMaps: true, versionKey: false });
        response.status(200).json(userObj);
    }

    private update = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const user = (request as express.Request & { user: IUser & mongoose.Document }).user;
        const update = request.body as FormUpdateDto;
        if (user.confirmed) {
            next(createHttpError(403, '报名信息已经被确认且不能再修改'));
        } else {
            await UserModel.findByIdAndUpdate(user._id, update);
            response.status(204).send();
        }
    }

    private cancel = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const user = (request as express.Request & { user: IUser & mongoose.Document }).user;
        await UserModel.findByIdAndUpdate(user._id, { confirmed: false });
        response.status(204).send();
    }
}

export default SignupController;
