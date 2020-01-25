import * as bcrypt from 'bcrypt';
import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import IUser from '../user/IUser';
import UserModel from '../user/UserModel';
import UserRegAndLoginDto from '../user/UserRegAndLoginDto';
import IController from './IController';

class AuthController implements IController {
    public readonly router = express.Router();
    private readonly path = '/auth';
    private readonly privateKey: Buffer;

    constructor(privateKey: Buffer) {
        this.privateKey = privateKey;
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}/register`, getValidationMiddleware(UserRegAndLoginDto), withUnhandledErrorBackup(this.register));
        this.router.post(`${this.path}/login`, getValidationMiddleware(UserRegAndLoginDto), withUnhandledErrorBackup(this.login));
    }

    private register = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const accountData = request.body as UserRegAndLoginDto;
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

    private login = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const accountData = request.body as UserRegAndLoginDto;
        const user = await UserModel.findOne({ email: accountData.email });
        const matching = !user ? false : await bcrypt.compare(accountData.password, user.password);
        if (!matching) {
            next(createHttpError(422, '指定的邮箱或密码不正确'));
        } else {
            response.setHeader('Set-Cookie', [this.createLoginCookie(user!)]);
            response.status(200).json({});
        }
    }

    private createLoginCookie(user: IUser) {
        const expiresIn = 60 * 60; // an hour
        const token = jwt.sign({ _id: user._id }, this.privateKey, { expiresIn, algorithm: 'RS256' });
        return `Authorization=${token}; HttpOnly; Max-Age=${expiresIn}`;
    }
}

export default AuthController;
