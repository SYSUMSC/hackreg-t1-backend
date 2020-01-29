import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import IUser from '../user/IUser';
import IUserToken from '../user/IUserToken';
import UserModel from '../user/UserModel';

function getAuthMiddleware(publicKey: Buffer) {
    return function authorizationMiddleware(request: express.Request & { user?: IUser & mongoose.Document }, response: express.Response, next: NextFunction) {
        const cookies = request.cookies;
        if (!cookies || !cookies.Authorization) {
            next(createHttpError(403, '需要登录才能进行操作'));
        } else {
            try {
                const token = jwt.verify(cookies.Authorization, publicKey, { algorithms: ['RS256'] }) as IUserToken;
                UserModel.findById(token._id).then((user) => {
                    if (!user) {
                        next(createHttpError(422, '无法识别身份信息或身份信息已过期，请重新登录'));
                    } else {
                        request.user = user;
                        next();
                    }
                }).catch(next);
            } catch (e) {
                next(createHttpError(422, '无法识别身份信息或身份信息已过期，请重新登录'));
            }
        }
    };
}

export default getAuthMiddleware;
