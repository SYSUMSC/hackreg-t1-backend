import express from 'express';
import IController from './IController';

class SignupController implements IController {
    public readonly router = express.Router();
    private readonly path = '/signup';

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
    }
}

export default SignupController;
