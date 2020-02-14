import { NextFunction, Response, Request } from 'express';
import createHttpError from 'http-errors';
import moment, { Moment } from 'moment';

function getTimeAvailableCheckingMiddleware(
  start: Moment,
  end: Moment,
  startErrorMsg: string,
  endErrorMsg: string
) {
  return function checkTime(request: Request, response: Response, next: NextFunction) {
    const now = moment();
    if (now.isBefore(start)) {
      next(createHttpError(403, startErrorMsg));
    } else if (now.isAfter(end)) {
      next(createHttpError(403, endErrorMsg));
    } else {
      next();
    }
  };
}

export default getTimeAvailableCheckingMiddleware;
