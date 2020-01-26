import express, { NextFunction } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import nodePath from 'path';
import getAuthMiddleware from '../middleware/AuthorizationMiddleware';
import { withUnhandledErrorBackup } from '../middleware/UnhandledErrorsBackup';
import IUser from '../user/IUser';
import IController from './IController';

export interface ISubmitControllerConfig {
    fileSizeLimit: number;
    tempDir: string;
    dir: string;
    publicKey: Buffer;
}

class SubmitController implements IController {
    public readonly router = express.Router();
    private readonly path = '/submit';
    private readonly config: ISubmitControllerConfig;

    constructor(config: ISubmitControllerConfig) {
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
            responseOnLimit: '文件大小已达上限',
        });
        this.router.post(this.path, getAuthMiddleware(this.config.publicKey), fileUploadMiddleware, withUnhandledErrorBackup(this.submit));
    }

    private submit = async (request: express.Request, response: express.Response, next: NextFunction) => {
        const file = request?.files?.work;
        if (!file || Array.isArray(file)) {
            next(createHttpError(400, '请求无效'));
        } else {
            const user = (request as express.Request & { user: IUser & mongoose.Document }).user;
            const uploadedFile = file as UploadedFile;
            await uploadedFile.mv(nodePath.join(this.config.dir, user._id, 'work.zip'));
        }
    }
}

export default SubmitController;
