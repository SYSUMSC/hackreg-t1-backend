import express from 'express';

export default interface IController {
    router: express.Router;
}
