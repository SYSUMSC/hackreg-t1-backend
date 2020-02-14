import { plainToClass } from 'class-transformer';
import { ClassType } from 'class-transformer/ClassTransformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import createHttpError from 'http-errors';

function getInvalidPropNames(errors: ValidationError[]): string[] {
  let names: string[] = [];
  errors.forEach(error => {
    if (error.children && error.children.length > 0) {
      names = names.concat(
        getInvalidPropNames(error.children).map(name => {
          if (!Number.isNaN(parseInt(error.property, 10))) {
            return `[${error.property}].${name}`;
          } else {
            return `${error.property}${name.startsWith('[') ? '' : '.'}${name}`;
          }
        })
      );
    } else {
      names.push(error.property);
    }
  });
  return names;
}

function getValidationMiddleware<T extends object>(dtoType: ClassType<T>): RequestHandler {
  return (request, _, next) => {
    validate(plainToClass(dtoType, request.body), { whitelist: true, forbidNonWhitelisted: true })
      .then(errors => {
        if (errors.length > 0) {
          next(createHttpError(400, '提供的信息不合要求', { names: getInvalidPropNames(errors) }));
        } else {
          next();
        }
      })
      .catch(next);
  };
}

export default getValidationMiddleware;
