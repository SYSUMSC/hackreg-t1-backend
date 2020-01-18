import { createLogger, format, transports } from 'winston';

const { File, Console } = transports;

const winstonLogger = createLogger({
    level: 'info',
});

if (process.env.NODE_ENV === 'production') {
    const fileFormat = format.combine(
        format.timestamp(),
        format.json(),
    );
    // TODO: maybe we should archive the log file timely
    const errTransport = new File({
        filename: './logs/error.log',
        format: fileFormat,
        level: 'error',
    });
    const infoTransport = new File({
        filename: './logs/combined.log',
        format: fileFormat,
    });
    winstonLogger.add(errTransport);
    winstonLogger.add(infoTransport);
} else {
    const errorStackFormat = format((info) => {
        if (info.stack) {
            // tslint:disable-next-line:no-console
            console.log(info.stack);
            return false;
        }
        return info;
    });
    const consoleTransport = new Console({
        format: format.combine(
            format.colorize(),
            format.simple(),
            errorStackFormat(),
        ),
    });
    winstonLogger.add(consoleTransport);
}

export const logger = winstonLogger;
