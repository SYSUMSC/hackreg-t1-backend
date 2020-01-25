import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import { logger } from '../shared/Logger';

function unhandledErrorsBackup(error: Error, request: express.Request, response: express.Response, next: NextFunction) {
    if (!(error instanceof createHttpError.HttpError)) {
        logger.error(`${error.name}: ${error.message}\n${error.stack}`);
        error = createHttpError(500, '服务器内部出错');
    }
    response.status((error as createHttpError.HttpError).status).json(error);
}

export function withUnhandledErrorBackup<T>(routeHandler: (request: express.Request, response: express.Response, next: NextFunction) => Promise<T>): express.RequestHandler {
    return (request, response, next) => {
        routeHandler(request, response, next).catch(next);
    };
}

export default unhandledErrorsBackup;
