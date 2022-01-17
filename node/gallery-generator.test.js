const { google } = require('googleapis');
const { logErrorIfDebug, printPage, printImageDiv, sortArray, print, generate } = require('./gallery-generator.js');
const fs = require('fs');
const readline = require('readline');

const originalConsoleError = console.error;
let consoleErrorOutput = [];
const mockedConsoleError = (output) => consoleErrorOutput.push(output);

const originalConsoleLog = console.log;
let consoleLogOutput = [];
const mockedConsoleLog = (output) => consoleLogOutput.push(output);

const originalWriteFileSync = fs.writeFileSync;

const resultFile = '../video-game-gallery.html'
const credentialsFile = './etc/credentials.json'
const tokenFile = './etc/token.json'

beforeEach(() => {
    console.log = mockedConsoleLog;
    console.error = mockedConsoleError;
    consoleLogOutput = [];
    consoleErrorOutput = [];
    process.env.DEBUG = false;
    jest.clearAllMocks();
    jest.resetAllMocks()
    assertDeleteFile(resultFile);
    // assertDeleteFile(credentialsFile)
});

afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.env.DEBUG = false;
    jest.clearAllMocks();
    jest.resetAllMocks()
    assertDeleteFile(resultFile);
    // assertDeleteFile(credentialsFile)
});

test('Log error, no debug', () => {
    expect(consoleErrorOutput).toMatchObject([]);
    logErrorIfDebug('error foo', {});
    expect(consoleErrorOutput).toMatchObject(['error foo']);
});

test('Log error with debug', () => {
    process.env.DEBUG = true;
    expect(consoleErrorOutput).toMatchObject([]);
    const exceptionObj = { exception: 'OUCH!' };
    logErrorIfDebug('error foo', exceptionObj);
    expect(consoleErrorOutput).toMatchObject(['error foo:', exceptionObj]);
});

test('Print page no game and no event', () => {
    const games = [];
    const events = [];
    const page = printPage(games, events);
    expect(page).toMatchSnapshot();
    expect(consoleErrorOutput).toMatchObject([]);
});

test('Print page 2 games and 2 events', () => {
    const games = [
        [
            'Castle Crashers',
            '2008',
            'PC',
            'None',
            'https://www.amazon.fr/photos/share/BhLQTEtDMf3evynYbZXEFKy9esdJJ0lCwo1k42J4YZB',
            'https://www.igdb.com/games/castle-crashers',
        ],
        [
            '13 Sentinels: Aegis Rim',
            '2020',
            'PlayStation 4',
            'FR',
            'https://www.amazon.fr/photos/share/WSuZ5VcpUyNz6BXoGm43gxaBW4OWDoWv4ICxn2rstDV',
            'https://www.igdb.com/games/13-sentinels-aegis-rim',
        ],
    ];
    const events = [
        [
            'Stunfest',
            '2019',
            'France',
            'https://www.amazon.fr/photos/share/zGgsGvndsaFUtiCUYnWQVxlkU06eOHNWwCh3PR7Lg76',
            'https://www.stunfest.com',
        ],
        [
            'Micromania Game Show',
            '2008',
            'France',
            'https://www.amazon.fr/photos/share/MzbIZOv4oDFcCURvoH1uFUq35FH6eLkUpFuMkZkpC57',
            'https://fr.wikipedia.org/wiki/Micromania_Game_Show',
        ],
    ];
    const page = printPage(games, events);
    expect(page).toMatchSnapshot();
    expect(consoleErrorOutput).toMatchObject([]);
});

test('Print image div no image file', () => {
    const game = [
        'GAMES DOES NOT EXIST',
    ]
    const page = printImageDiv(game, 'screenshots');
    expect(page).toBe('')
    expect(consoleErrorOutput.length).toBe(1)
    expect(consoleErrorOutput[0]).toMatch(/^Image miniature n'existe pas : /);
});

test('Sort array google sheet', () => {
    const games = [
        [
            'Z'
        ],
        [
            'A'
        ],
        [
            'B'
        ]
    ];
    sortArray(games)
    expect(games.length).toBe(3)
    expect(games[0][0]).toBe('A');
    expect(games[1][0]).toBe('B');
    expect(games[2][0]).toBe('Z');
});

test('Print; error screenshots range', () => {
    initMockGoogleApi('Error A');

    print();

    expect(consoleErrorOutput).toMatchObject(["The API returned an error (get screenshots):", "Error A"]);
    assertAbsentFile(resultFile);
});

test('Print; screenshots range; no data', () => {
    initMockGoogleApi(undefined, { data: { values: [] } });

    print();

    expect(consoleErrorOutput).toMatchObject(["Screenshots: no data found."]);
    assertAbsentFile(resultFile);
});

test('Print; screenshots range OK; error events range', () => {
    const games = [
        [
            'Castle Crashers'
        ]
    ];
    initMockGoogleApi(undefined, { data: { values: games } }, 'Error B');

    print();

    expect(consoleErrorOutput).toMatchObject(["The API returned an error (get events):", "Error B"]);
    assertAbsentFile(resultFile);
});

test('Print; screenshots range OK; events range no data', () => {
    const games = [
        [
            'Castle Crashers'
        ]
    ];
    initMockGoogleApi(undefined, { data: { values: games } }, undefined, { data: { values: [] } });

    print();

    expect(consoleErrorOutput).toMatchObject(["Events: no data found."]);
    assertAbsentFile(resultFile);
});

test('Print; screenshots range OK; events range OK', () => {
    const games = [
        [
            'Castle Crashers',
            '2008',
            'PC',
            'None',
            'https://www.amazon.fr/photos/share/BhLQTEtDMf3evynYbZXEFKy9esdJJ0lCwo1k42J4YZB',
            'https://www.igdb.com/games/castle-crashers',
        ]
    ];
    const events = [
        [
            'Stunfest',
            '2019',
            'France',
            'https://www.amazon.fr/photos/share/zGgsGvndsaFUtiCUYnWQVxlkU06eOHNWwCh3PR7Lg76',
            'https://www.stunfest.com',
        ]
    ];
    initMockGoogleApi(undefined, { data: { values: games } }, undefined, { data: { values: events } });

    print();

    const resultStr = fs.readFileSync(resultFile);
    expect(resultStr).toMatchSnapshot();
    expect(consoleErrorOutput).toMatchObject([]);
    expect(consoleLogOutput).toMatchObject(['Fichier écrit.']);
});

test('Print; screenshots range OK; events range OK ; error writing file', () => {
    const games = [
        [
            'Castle Crashers',
            '2008',
            'PC',
            'None',
            'https://www.amazon.fr/photos/share/BhLQTEtDMf3evynYbZXEFKy9esdJJ0lCwo1k42J4YZB',
            'https://www.igdb.com/games/castle-crashers',
        ]
    ];
    const events = [
        [
            'Stunfest',
            '2019',
            'France',
            'https://www.amazon.fr/photos/share/zGgsGvndsaFUtiCUYnWQVxlkU06eOHNWwCh3PR7Lg76',
            'https://www.stunfest.com',
        ]
    ];
    initMockGoogleApi(undefined, { data: { values: games } }, undefined, { data: { values: events } });
    const error = new Error("ERROR C!");
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw error;
    });

    print();

    assertAbsentFile(resultFile);
    expect(consoleErrorOutput).toMatchObject(["Error writing file:", error]);
    expect(consoleLogOutput).toMatchObject([]);
});

test('Generate ; no credentials', () => {
    assertDeleteFile(credentialsFile)
    generate();

    expect(consoleErrorOutput).toMatchObject(['Error parsing client secret file']);
    expect(consoleLogOutput).toMatchObject([]);
});

test('Generate ; wrong credentials format', () => {
    assertDeleteFile(credentialsFile)
    originalWriteFileSync(credentialsFile, "foo");

    generate();

    expect(consoleErrorOutput).toMatchObject(['Error parsing client secret file']);
    expect(consoleLogOutput).toMatchObject([]);
});

test('Generate ; no token', () => {
    assertDeleteFile(credentialsFile)
    assertDeleteFile(tokenFile)
    originalWriteFileSync(credentialsFile, JSON.stringify({ installed: { client_secret: 'secret', client_id: 'id', redirect_uris: [''] } }));

    generate();

    expect(consoleErrorOutput).toMatchObject(['Error reading token file']);
    expect(consoleLogOutput).toMatchObject(["Authorize this app by visiting this url:"]);

    const rl = readline.createInterface({
        input: process.stdin
    });
    rl.write("foo");
    rl.close();
});

test('Generate ; wrong token format', () => {
    assertDeleteFile(credentialsFile)
    originalWriteFileSync(credentialsFile, JSON.stringify({ installed: { client_secret: 'secret', client_id: 'id', redirect_uris: [''] } }));
    originalWriteFileSync(tokenFile, "foo")

    generate();

    expect(consoleErrorOutput).toMatchObject(['Error parsing token file']);
    expect(consoleLogOutput).toMatchObject([]);
});

test('Generate ; error', () => {
    assertDeleteFile(credentialsFile)
    assertDeleteFile(tokenFile)
    originalWriteFileSync(credentialsFile, JSON.stringify({ installed: { client_secret: 'secret', client_id: 'id', redirect_uris: [''] } }));
    originalWriteFileSync(tokenFile, "{}")

    generate();

    expect(consoleErrorOutput).toMatchObject(['Error generating document']);
    expect(consoleLogOutput).toMatchObject([]);
});

test('Generate ; check call print', () => {
    assertDeleteFile(credentialsFile)
    assertDeleteFile(tokenFile)
    originalWriteFileSync(credentialsFile, JSON.stringify({ installed: { client_secret: 'secret', client_id: 'id', redirect_uris: [''] } }));
    originalWriteFileSync(tokenFile, "{}")

    initMockGoogleApi('Error D');

    generate();

    expect(consoleErrorOutput).toMatchObject(['The API returned an error (get screenshots):', "Error D"]);
    expect(consoleLogOutput).toMatchObject([]);
});

function initMockGoogleApi(errorScreenshots, resScreenshots, errorEvents, resEvents) {
    process.env.DEBUG = true;

    class MockSheetsValues {
        get() { /* Do nothing */ }
    }
    const mockSheetsValues = new MockSheetsValues()
    const mockedGoogleSheets = { spreadsheets: { values: mockSheetsValues } }
    jest.spyOn(google, "sheets").mockImplementation(() => mockedGoogleSheets);
    jest.spyOn(mockSheetsValues, "get").mockImplementation((arg1, arg2) => {
        if (arg1.range.match(/.+screenshots.+/)) {
            arg2(errorScreenshots, resScreenshots)
        } else {
            arg2(errorEvents, resEvents)
        }
    });
}

function assertDeleteFile(file) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
    assertAbsentFile(file)
}

function assertAbsentFile(file) {
    expect(fs.existsSync(file)).toBeFalsy();
}