const { logErrorIfDebug } = require('./gallery-generator.js');

const originalConsoleError = console.error;
let consoleErrorOutput = [];
const mockedConsoleError = output => consoleErrorOutput.push(output);

beforeEach(() => {
    console.error = mockedConsoleError;
    consoleErrorOutput = [];
    process.env.DEBUG = false;
});

afterEach(() => {
    console.error = originalConsoleError;
    process.env.DEBUG = false;
});

test('Log error, no debug', () => {
    expect(consoleErrorOutput).toMatchObject([])
    logErrorIfDebug("error foo", {});
    expect(consoleErrorOutput).toMatchObject(["error foo"])
});

test('Log error with debug', () => {
    process.env.DEBUG = true;
    expect(consoleErrorOutput).toMatchObject([])
    const exceptionObj = { exception: "OUCH!" }
    logErrorIfDebug("error foo", exceptionObj);
    expect(consoleErrorOutput).toMatchObject(["error foo:", exceptionObj])
});