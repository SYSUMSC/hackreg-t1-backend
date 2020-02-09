import express, { NextFunction } from 'express';
import createHttpError from 'http-errors';
import moment, { Moment } from 'moment';

function getTimeAvailableCheckingMiddleware(
  start: Moment,
  end: Moment,
  startErrorMsg: string,
  endErrorMsg: string
) {
  return function checkTime(
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) {
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
