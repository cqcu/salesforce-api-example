import express from 'express';
import cors from 'cors';
import logger, { Options } from 'pino-http';
import pino from './logger';
import router from './routes';
const app = express();

// ORDER MATTERS!
app.use(logger({ logger: pino } as Options));
app.use(cors());
app.use(express.json());
app.use(router);
const port = process.env.PORT || 8081;
const server = app.listen(port, () => {
    pino.info(`READY - listening on port ${port}`);
});

server.on('error', pino.error);
