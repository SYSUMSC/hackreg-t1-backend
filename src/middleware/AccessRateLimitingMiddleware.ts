import express from 'express';
import createHttpError from 'http-errors';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

function getAccessRateLimitingMiddleware<T extends RateLimiterAbstract>(
  limiter: T,
  getKey: (request: express.Request) => string
): express.RequestHandler {
  if (process.env.NODE_ENV === 'development') {
    return (_, __, next) => next();
  }
  return (request, _, next) => {
    limiter
      .consume(getKey(request))
      .then(() => next())
      .catch(() => next(createHttpError(429, '访问频率过高，请稍后再试')));
  };
}

export default getAccessRateLimitingMiddleware;
