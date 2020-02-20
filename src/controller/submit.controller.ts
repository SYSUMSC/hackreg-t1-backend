import { NextFunction, Request, Response, Router } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import createHttpError from 'http-errors';
import { Moment } from 'moment';
import mongoose from 'mongoose';
import nodePath from 'path';
import getAuthMiddleware from '../middleware/auth.middleware';
import getTimeAvailableCheckingMiddleware from '../middleware/timeCheck.middleware';
import { withUnhandledErrorBackup } from '../middleware/unhandledErrors.middleware';
import User from '../account/type/user';
import Controller from './base.controller';
import { pathExists, mkdir, remove } from 'fs-extra';

export interface SubmitControllerConfig {
  fileSizeLimit: number;
  tempDir: string;
  dir: string;
  publicKey: Buffer;
  startTime: Moment;
  endTime: Moment;
}

class SubmitController implements Controller {
  public readonly router = Router();
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
      limitHandler: (req: Request, res: Response, next: NextFunction) => {
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

  private submit = async (request: Request, response: Response, next: NextFunction) => {
    const file = request?.files?.work;
    if (!file || Array.isArray(file)) {
      next(createHttpError(400, '请求无效'));
    } else {
      const user = (request as Request & {
        user: User & mongoose.Document;
      }).user;
      const uploadedFile = file as UploadedFile;
      const path = nodePath.join(this.config.dir, String(user._id));
      const filePath = nodePath.join(path, 'work.zip');
      if (await pathExists(path)) {
        await remove(filePath);
      } else {
        await mkdir(path);
      }
      await uploadedFile.mv(filePath);
      response.status(204).send();
    }
  };
}

export default SubmitController;
