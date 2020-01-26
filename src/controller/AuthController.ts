import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import moment from 'moment';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import getValidationMiddleware from '../middleware/ValidationMiddleware';
import IUser from '../user/IUser';
import PasswordResetConfirmDto from '../user/PasswordResetConfirmDto';
import PasswordResetDto from '../user/PasswordResetDto';
import UserModel from '../user/UserModel';
import UserPasswordResetModel from '../user/UserPasswordResetModel';
import UserRegAndLoginDto from '../user/UserRegAndLoginDto';
import IController from './IController';

export interface IAuthControllerConfig {
    privateKey: Buffer;
    emailDuration: number;
    smtpConfig: ISmtpConfig;
}

export interface ISmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string, pass: string };
}

class AuthController implements IController {
    public readonly router = express.Router();
    private readonly path = '/auth';
    private readonly config: IAuthControllerConfig;
    private readonly transporter: Mail;

    constructor(config: IAuthControllerConfig) {
        this.config = config;
        this.transporter = nodemailer.createTransport(this.config.smtpConfig);
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}/register`, getValidationMiddleware(UserRegAndLoginDto), withUnhandledErrorBackup(this.register));
        this.router.post(`${this.path}/login`, getValidationMiddleware(UserRegAndLoginDto), withUnhandledErrorBackup(this.login));
        this.router.post(`${this.path}/reset`, getValidationMiddleware(PasswordResetDto), withUnhandledErrorBackup(this.reset));
        this.router.post(`${this.path}/confirm`, getValidationMiddleware(PasswordResetConfirmDto), withUnhandledErrorBackup(this.confirm));
    }

    private register = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const accountData = request.body as UserRegAndLoginDto;
        if (await UserModel.findOne({ email: accountData.email })) {
            next(createHttpError(409, '指定邮箱的账户已经存在'));
        } else {
            const hash = await bcrypt.hash(accountData.password, 10);
            const user = new UserModel({
                email: accountData.email,
                password: hash,
                confirmed: false,
                form: {
                    teamName: '',
                    teamDescription: '',
                    memberInfo: [],
                },
            });
            await user.save();
            response.setHeader('Set-Cookie', [this.createLoginCookie(user)]);
            response.status(201).json({});
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
        const token = jwt.sign({ _id: user._id }, this.config.privateKey, { expiresIn, algorithm: 'RS256' });
        return `Authorization=${token}; HttpOnly; Max-Age=${expiresIn}`;
    }

    private reset = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const dto = request.body as PasswordResetDto;
        const user = await UserModel.findOne({ email: dto.email });
        if (!user) {
            response.status(200).json({}); // TODO: shouldn't we send an error?
        } else {
            await UserPasswordResetModel.findOneAndDelete({ id: user._id });
            const token = crypto.randomBytes(32).toString('hex');
            const hash = await bcrypt.hash(token, 10);
            await UserPasswordResetModel.create({
                id: user._id,
                token: hash,
                expire: moment.utc().add(this.config.emailDuration, 'minutes').valueOf(),
            });
            response.status(200).json({});
            // TODO: send mail
        }
    }

    private confirm = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const dto = request.body as PasswordResetConfirmDto;
        const user = await UserModel.findOne({ email: dto.email });
        if (!user) {
            next(createHttpError(400, '重制密码操作无效或已过期')); // TODO: should we improve it?
        } else {
            const reset = await UserPasswordResetModel.findOne({ id: user._id });
            const matched = reset ? await bcrypt.compare(dto.token, reset.token) : false;
            const outdated = reset ? moment(reset.expire).isBefore(moment().utc()) : true;
            if (!reset || !matched || outdated) {
                next(createHttpError(400, '重制密码操作无效或已过期'));
            } else {
                const hash = await bcrypt.hash(dto.password, 10);
                await UserModel.findByIdAndUpdate(reset.id, { password: hash });
                await UserPasswordResetModel.deleteOne({ id: user._id });
                response.status(200).json({});
            }
        }
    }
}

export default AuthController;
