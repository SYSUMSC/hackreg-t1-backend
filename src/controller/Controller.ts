import express from 'express';

export default interface Controller {
  router: express.Router;
}
