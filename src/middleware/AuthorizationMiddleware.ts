import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import IUser from '../user/IUser';
import IUserToken from '../user/IUserToken';
import UserModel from '../user/UserModel';

function getAuthMiddleware(publicKey: Buffer) {
    return function authorizationMiddleware(request: express.Request & { user: IUser}, response: express.Response, next: NextFunction) {
        const cookies = request.cookies;
        if (!cookies || !cookies.Authorization) {
            next(createHttpError(403, '需要登录才能进行操作'));
        }
        try {
            const token = jwt.verify(cookies.Authorization, publicKey) as IUserToken;
            UserModel.findById(token._id).then((user) => {
                if (!user) {
                    next(createHttpError(403, '无法识别身份信息'));
                } else {
                    request.user = user;
                    next();
                }
            }).catch(next);
        } catch (e) {
            next(createHttpError(403, '无法识别身份信息'));
        }
    };
}

export default getAuthMiddleware;
