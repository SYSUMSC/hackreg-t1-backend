import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import getAuthMiddleware from '../middleware/AuthorizationMiddleware';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import FormUpdateDto from '../user/FormUpdateDto';
import IUser from '../user/IUser';
import UserModel from '../user/UserModel';
import IController from './IController';

class SignupController implements IController {
    public readonly router = express.Router();
    private readonly path = '/signup';
    private readonly publicKey: Buffer;

    constructor(publicKey: Buffer) {
        this.publicKey = publicKey;
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/fetch`, getAuthMiddleware(this.publicKey), withUnhandledErrorBackup(this.fetch));
        this.router.post(`${this.path}/update`, getAuthMiddleware(this.publicKey), getValidationMiddleware(FormUpdateDto), withUnhandledErrorBackup(this.update));
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
            await UserModel.findByIdAndUpdate(user._id, update, err => next(err));
            response.status(200).json({});
        }
    }
}

export default SignupController;
