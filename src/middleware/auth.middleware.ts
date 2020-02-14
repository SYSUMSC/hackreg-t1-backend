import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../account/type/user';
import UserToken from '../account/type/userToken';
import UserModel from '../account/model/user.model';

function getAuthMiddleware(publicKey: Buffer) {
  return function authorizationMiddleware(
    request: Request & { user?: User & mongoose.Document },
    response: Response,
    next: NextFunction
  ) {
    const cookies = request.cookies;
    if (!cookies || !cookies.Authorization) {
      next(createHttpError(403, '需要登录才能进行操作'));
    } else {
      try {
        const token = jwt.verify(cookies.Authorization, publicKey, {
          algorithms: ['RS256']
        }) as UserToken;
        UserModel.findById(token._id)
          .then(user => {
            if (!user) {
              next(createHttpError(422, '无法识别身份信息或身份信息已过期，请重新登录'));
            } else {
              request.user = user;
              next();
            }
          })
          .catch(next);
      } catch (e) {
        next(createHttpError(422, '无法识别身份信息或身份信息已过期，请重新登录'));
      }
    }
  };
}

export default getAuthMiddleware;
