import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction, RequestHandler, Router } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import moment from 'moment';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { RateLimiterAbstract, RateLimiterCluster } from 'rate-limiter-flexible';
import getAccessRateLimitingMiddleware from '../middleware/accessRateLimit.middleware';
import { withUnhandledErrorBackup } from '../middleware/unhandledErrors.middleware';
import getValidationMiddleware from '../middleware/validation.middleware';
import PasswordResetConfirmDto from '../account/dto/passwordResetConfirm.dto';
import PasswordResetDto from '../account/dto/passwordReset.dto';
import UserModel from '../account/model/user.model';
import UserPasswordResetModel from '../account/model/userPasswordReset.model';
import UserRegAndLoginDto from '../account/dto/userRegAndLogin.dto';
import Controller from './base.controller';

export interface AuthControllerConfig {
  privateKey: Buffer;
  emailDuration: number;
  smtpConfig: SmtpConfig;
  emailTemplate: PasswordResetEmailTemplate;
  loginLimiterByEmailAndIpPoints: number;
  loginLimiterByEmailAndIpDuration: number;
  loginLimiterByIpPoints: number;
  loginLimiterByIpDuration: number;
  authRelatedLimiterByEmailAndIpPoints: number;
  authRelatedLimiterByEmailAndIpDuration: number;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export interface PasswordResetEmailTemplate {
  from: string;
  subject: string;
  html: string;
}

class AuthController implements Controller {
  public readonly router = Router();
  private readonly path = '/auth';
  private readonly config: AuthControllerConfig;
  private readonly transporter: Mail;
  private readonly loginLimiterByEmailAndIp: RateLimiterAbstract;
  private readonly loginLimiterByIp: RateLimiterAbstract;
  private readonly authRelatedLimiterByEmailAndIp: RateLimiterAbstract;
  private readonly rateLimitingMiddleware: RequestHandler;

  constructor(config: AuthControllerConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport(this.config.smtpConfig);
    this.loginLimiterByEmailAndIp = new RateLimiterCluster({
      storeClient: undefined,
      keyPrefix: 'loginLimiterByEmailAndIp',
      points: this.config.loginLimiterByEmailAndIpPoints,
      duration: this.config.loginLimiterByEmailAndIpDuration
    });
    this.loginLimiterByIp = new RateLimiterCluster({
      storeClient: undefined,
      keyPrefix: 'loginLimiterByIp',
      points: this.config.loginLimiterByIpPoints,
      duration: this.config.loginLimiterByIpDuration
    });
    this.authRelatedLimiterByEmailAndIp = new RateLimiterCluster({
      storeClient: undefined,
      keyPrefix: 'authRelatedLimiterByEmailAndIp',
      points: this.config.authRelatedLimiterByEmailAndIpPoints,
      duration: this.config.authRelatedLimiterByEmailAndIpDuration
    });
    this.rateLimitingMiddleware = getAccessRateLimitingMiddleware(
      this.authRelatedLimiterByEmailAndIp,
      req => req.body.email
    );
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      `${this.path}/register`,
      getValidationMiddleware(UserRegAndLoginDto),
      this.rateLimitingMiddleware,
      withUnhandledErrorBackup(this.register)
    );

    this.router.post(
      `${this.path}/login`,
      getValidationMiddleware(UserRegAndLoginDto),
      withUnhandledErrorBackup(this.login)
    );

    this.router.post(`${this.path}/logout`, withUnhandledErrorBackup(this.logout));

    this.router.post(
      `${this.path}/reset`,
      getValidationMiddleware(PasswordResetDto),
      this.rateLimitingMiddleware,
      withUnhandledErrorBackup(this.reset)
    );

    this.router.post(
      `${this.path}/confirm`,
      getValidationMiddleware(PasswordResetConfirmDto),
      this.rateLimitingMiddleware,
      withUnhandledErrorBackup(this.confirm)
    );
  }

  private register = async (request: Request, response: Response, next: NextFunction) => {
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
            description: ''
          },
          memberInfo: []
        }
      });
      await user.save();
      const token = jwt.sign({ _id: user!._id }, this.config.privateKey, {
        expiresIn: '12h',
        algorithm: 'RS256'
      });
      response.cookie('Authorization', token, {
        maxAge: 43200000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      response.status(204).send();
    }
  };

  private login = async (request: Request, response: Response, next: NextFunction) => {
    const accountData = request.body as UserRegAndLoginDto;
    const ip = request.ip;
    const emailIpKey = `${accountData.email}-${ip}`;
    const user = await UserModel.findOne({ email: accountData.email });

    if (!user) {
      await this.loginLimiterByIp
        .consume(ip)
        .catch(() => next(createHttpError(429, '登录失败频率过高，请稍后再试')));
    }

    const matching = !user ? false : await bcrypt.compare(accountData.password, user.password);
    if (!matching) {
      await this.loginLimiterByEmailAndIp
        .consume(emailIpKey)
        .then(() => next(createHttpError(422, '邮箱或密码有误，登录失败')))
        .catch(() => next(createHttpError(429, '登录失败频率过高，请稍后再试')));
    } else {
      await this.loginLimiterByEmailAndIp.delete(emailIpKey);
      const token = jwt.sign({ _id: user!._id }, this.config.privateKey, {
        expiresIn: '12h',
        algorithm: 'RS256'
      });
      response.cookie('Authorization', token, {
        maxAge: 43200000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      response.status(204).send();
    }
  };

  private logout = async (_request: Request, response: Response, _next: NextFunction) => {
    response.clearCookie('Authorization', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    response.status(204).send();
  };

  private reset = async (request: Request, response: Response, _next: NextFunction) => {
    const dto = request.body as PasswordResetDto;
    const user = await UserModel.findOne({ email: dto.email });
    if (!user) {
      response.status(404).json({ message: '该邮箱对应的账户不存在' });
    } else {
      await UserPasswordResetModel.findOneAndDelete({ id: user._id });
      const token = crypto.randomBytes(32).toString('hex');
      const hash = await bcrypt.hash(token, 10);
      await UserPasswordResetModel.create({
        id: user._id,
        token: hash,
        expire: moment()
          .add(this.config.emailDuration, 'minutes')
          .valueOf()
      });
      await this.transporter.sendMail({
        from: this.config.emailTemplate.from.replace(
          '${SMTP_USER}',
          this.config.smtpConfig.auth.user
        ),
        to: dto.email,
        subject: this.config.emailTemplate.subject,
        html: this.config.emailTemplate.html
          .replace('${TOKEN}', token)
          .replace('${EMAIL}', dto.email)
      });
      response.status(204).send();
    }
  };

  private confirm = async (request: Request, response: Response, next: NextFunction) => {
    const dto = request.body as PasswordResetConfirmDto;
    const user = await UserModel.findOne({ email: dto.email });
    if (!user) {
      next(createHttpError(400, '验证码无效或已过期，重置密码操作无效'));
    } else {
      const reset = await UserPasswordResetModel.findOne({ id: user._id });
      const matched = reset ? await bcrypt.compare(dto.token, reset.token) : false;
      const outdated = reset ? moment(reset.expire).isBefore(moment()) : true;
      if (!reset || !matched || outdated) {
        next(createHttpError(400, '验证码无效或已过期，重置密码操作无效'));
      } else {
        const hash = await bcrypt.hash(dto.password, 10);
        await UserModel.findByIdAndUpdate(reset.id, { password: hash });
        await UserPasswordResetModel.deleteOne({ id: user._id });
        response.status(204).send();
      }
    }
  };
}

export default AuthController;
