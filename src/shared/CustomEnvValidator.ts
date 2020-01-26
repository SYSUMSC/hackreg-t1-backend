import { makeValidator } from 'envalid';
import { pathExistsSync, statSync } from 'fs-extra';

export const exsistingDir = makeValidator<string>((input) => {
    if (!pathExistsSync(input) || !statSync(input).isDirectory()) {
        throw new Error('Expected an exsisting directory');
    }
    return true;
});

export const minute = makeValidator<number>((input) => {
    const duration = parseInt(input, 10);
    if (Number.isNaN(duration)) {
        throw new Error('Expected a number');
    }
    if (duration < 1 || duration > 60) {
        throw new Error('The duration should be between 1 and 60');
    }
    return true;
});
