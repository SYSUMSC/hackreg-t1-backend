import { plainToClass } from 'class-transformer';
import { ClassType } from 'class-transformer/ClassTransformer';
import { validate } from 'class-validator';
import express from 'express';
import createHttpError from 'http-errors';

function getValidationMiddleware<T extends object>(dtoType: ClassType<T>): express.RequestHandler {
    return (request, _, next) => {
        validate(plainToClass(dtoType, request.body), { whitelist: true, forbidNonWhitelisted: true })
            .then((errors) => {
                if (errors.length > 0) {
                    const names = errors.map((error) => error.property);
                    next(createHttpError(400, '提供的信息不合要求', { names }));
                } else {
                    next();
                }
            })
            .catch(next);
    };
}

export default getValidationMiddleware;
