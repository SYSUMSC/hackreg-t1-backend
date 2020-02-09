import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import moment from 'moment';

export const DATE_FORMAT = 'MM/DD HH:mm:ss:SSS';

function unhandledErrorsBackup(
  error: Error,
  request: express.Request,
  response: express.Response,
  next: NextFunction
) {
  if (!(error instanceof createHttpError.HttpError)) {
    if (error instanceof SyntaxError) {
      error = createHttpError(400, '请求内容的JSON格式有误');
    } else {
      console.error(`An error was caused at ${moment().format(DATE_FORMAT)}`);
      console.error(error);
      error = createHttpError(500, '服务器内部出错');
    }
  }
  response.status((error as createHttpError.HttpError).status).json(error);
}

export function withUnhandledErrorBackup<T>(
  routeHandler: (
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) => Promise<T>
): express.RequestHandler {
  return (request, response, next) => {
    routeHandler(request, response, next).catch(next);
  };
}

export default unhandledErrorsBackup;
