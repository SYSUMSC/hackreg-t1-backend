import * as bcrypt from 'bcrypt';
import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import UserAccountDto from '../user/UserAccountDto';
import UserModel from '../user/UserModel';
import IController from './IController';

class AuthController implements IController {
    public readonly router = express.Router();
    private readonly path = '/auth';

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}/register`, getValidationMiddleware(UserAccountDto), withUnhandledErrorBackup(this.register));
    }

    private register = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const accountData = request.body as UserAccountDto;
        if (await UserModel.findOne({ email: accountData.email })) {
            next(createHttpError(409, '指定邮箱的账户已经存在'));
        } else {
            const hash = await bcrypt.hash(accountData.password, 10);
            await UserModel.create({
                email: accountData.email,
                password: hash,
                confirmed: false,
                form: {
                    teamName: '',
                    teamDescription: '',
                    memberInfo: [],
                },
            });
            response.status(201).json({}); // TODO: set cookie
        }
    }
}

export default AuthController;
