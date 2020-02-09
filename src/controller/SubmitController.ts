import express, { NextFunction } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import createHttpError from 'http-errors';
import { Moment } from 'moment';
import mongoose from 'mongoose';
import nodePath from 'path';
import getAuthMiddleware from '../middleware/AuthorizationMiddleware';
import getTimeAvailableCheckingMiddleware from '../middleware/TimeAvailableCheckingMiddleware';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import User from '../user/User';
import Controller from './Controller';

export interface SubmitControllerConfig {
  fileSizeLimit: number;
  tempDir: string;
  dir: string;
  publicKey: Buffer;
  startTime: Moment;
  endTime: Moment;
}

class SubmitController implements Controller {
  public readonly router = express.Router();
  private readonly path = '/submit';
  private readonly config: SubmitControllerConfig;

  constructor(config: SubmitControllerConfig) {
    this.config = config;
    this.initRoutes();
  }

  private initRoutes() {
    const fileUploadMiddleware = fileUpload({
      limits: { fileSize: this.config.fileSizeLimit * 1024 * 1024 },
      useTempFiles: true,
      tempFileDir: this.config.tempDir,
      safeFileNames: true,
      abortOnLimit: true,
      limitHandler: (req: express.Request, res: express.Response, next: NextFunction) => {
        next(createHttpError(400, '文件大小超过上限'));
      }
    });
    this.router.post(
      this.path,
      getTimeAvailableCheckingMiddleware(
        this.config.startTime,
        this.config.endTime,
        '作品提交尚未开始',
        '作品提交已经截止'
      ),
      getAuthMiddleware(this.config.publicKey),
      fileUploadMiddleware,
      withUnhandledErrorBackup(this.submit)
    );
  }

  private submit = async (
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) => {
    const file = request?.files?.work;
    if (!file || Array.isArray(file)) {
      next(createHttpError(400, '请求无效'));
    } else {
      const user = (request as express.Request & {
        user: User & mongoose.Document;
      }).user;
      const uploadedFile = file as UploadedFile;
      await uploadedFile.mv(nodePath.join(this.config.dir, user._id, 'work.zip'));
      response.status(204).send();
    }
  };
}

export default SubmitController;
