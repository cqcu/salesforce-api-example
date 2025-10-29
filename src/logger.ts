import pino from 'pino';
import config from 'config';

export default pino({
    name: 'salesforce-api-svc',
    level: config.get('logLevel'),
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: true,
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
        },
    },
    customLevels: {
        debug: 10,
        undefined: 10,
        info: 20,
        warn: 30,
        error: 40,
        fatal: 50,
    },
});
