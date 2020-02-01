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
        this.router.post(`${this.path}/logout`, withUnhandledErrorBackup(this.logout));
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
                    teamInfo: {
                        name: '',
                        description: '',
                    },
                    memberInfo: [],
                },
            });
            await user.save();
            const token = jwt.sign({ _id: user!._id }, this.config.privateKey, { expiresIn: '12h', algorithm: 'RS256' });
            response.cookie('Authorization', token, { maxAge: 43200000, httpOnly: true });
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
            const token = jwt.sign({ _id: user!._id }, this.config.privateKey, { expiresIn: '12h', algorithm: 'RS256' });
            response.cookie('Authorization', token, { maxAge: 43200000, httpOnly: true });
            response.status(200).json({});
        }
    }

    private logout = async (request: express.Request, response: express.Response, next: NextFunction) => {
        response.clearCookie('Authorization', { httpOnly: true });
        response.status(200).json({});
    }

    private reset = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const dto = request.body as PasswordResetDto;
        const user = await UserModel.findOne({ email: dto.email });
        if (!user) {
            response.status(400).json({ message: '该邮箱对应的账户不存在' });
        } else {
            await UserPasswordResetModel.findOneAndDelete({ id: user._id });
            const token = crypto.randomBytes(32).toString('hex'); // TODO: is it safe enough?
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
            next(createHttpError(400, '验证码无效或已过期，重置密码操作无效')); // TODO: should we improve it?
        } else {
            const reset = await UserPasswordResetModel.findOne({ id: user._id });
            const matched = reset ? await bcrypt.compare(dto.token, reset.token) : false;
            const outdated = reset ? moment(reset.expire).isBefore(moment().utc()) : true;
            if (!reset || !matched || outdated) {
                next(createHttpError(400, '验证码无效或已过期，重置密码操作无效'));
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
