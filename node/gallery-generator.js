const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) {
        logErrorIfDebug('Error loading client secret file', err);
    } else {
        // Authorize a client with credentials, then call the Google Sheets API.
        try {
            authorize(JSON.parse(content), print);
        } catch (exception) {
            logErrorIfDebug('Error parsing client secret file', exception);
        }
    }
});

function logErrorIfDebug(errorMsg, errorObj) {
    if (process.env.DEBUG === 'true') {
        console.error(errorMsg + ':');
        console.error(errorObj);
    } else {
        console.error(errorMsg);
    }
}
exports.logErrorIfDebug = logErrorIfDebug;

function printPage(rowsScreenshots, rowsEvents) {
    var page = `<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Video Game Gallery by Zhykos.fr</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/baguettebox.js/1.10.0/baguetteBox.min.css" />
    <link rel="stylesheet" href="css/compact-gallery.css">
    <link rel="icon" type="image/x-icon" href="assets/img/gallery/logo.ico" />
</head>

<body>
    <section class="gallery-block compact-gallery">
        <div class="main">
            <div class="heading">
                <img class="img-fluid image" src="assets/img/gallery/logo.png" style="height: 100px;" />
                <h2>Video Game Gallery by Zhykos.fr</h2>
                Sheet index: <a
                    href="https://docs.google.com/spreadsheets/d/1qRqKggPFYto2UyAYh8U66Z9pnXpmwbmwHkfwsMZrLZU/edit?usp=sharing">Google
                    Sheet</a><br />
                Go back to main website: <a href="./index.html">Zhykos.fr</a><br /><br />
                Links index: <a href="#screenshots">Screenshots</a> / <a href="#events">Events</a>
            </div>
            <div class="heading">
                <h3><a id="screenshots"></a>Thomas "Zhykos"'screenshots</h3>
                ${rowsScreenshots.length} games
            </div>
            <div class="row no-gutters">`;
    rowsScreenshots.map((row) => {
        page += printImageDiv(row, 'screenshots');
    });
    page += `
            </div>
            <div class="heading" style="padding-top: 50px;">
                <h3><a id="events"></a>Events</h3>
                ${rowsEvents.length} events
            </div>
            <div class="row no-gutters">`;
    rowsEvents.map((row) => {
        page += printImageDiv(row, 'events');
    });
    page += `
            </div>
        </div>
        <br />
        <div>Logo made from 2 icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a
                href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    </section>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/baguettebox.js/1.10.0/baguetteBox.min.js"></script>
    <script>
        baguetteBox.run('.compact-gallery', { animation: 'slideIn' });
    </script>
</body>
</html>`;
    fs.writeFile('../video-game-gallery.html', page, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log('Fichier écrit.');
    });
}

function printImageDiv(columnsData, type) {
    const htmlImg = `assets/img/gallery/${getImageName(columnsData, type)}.jpg`;
    if (fs.existsSync('../' + htmlImg)) {
        var url;
        if (type == 'screenshots') {
            url = columnsData[4];
        } else if (type == 'events') {
            url = columnsData[3];
        } else {
            url = columnsData[1];
        }
        var imageDiv = `
        <div class="col-md-6 col-lg-3 item zoom-on-hover">
            <a class="lightbox"
                href="${url}">
                <img class="img-fluid image"
                    src="${htmlImg}" />
                <span class="description">
                    <span class="description-heading">${columnsData[0]}</span>`;
        if (type == 'screenshots') {
            imageDiv += `<span class="description-body">${columnsData[1]} - ${columnsData[2]} - ${columnsData[3]}</span>`;
        } else if (type == 'events') {
            imageDiv += `<span class="description-body">${columnsData[1]} - ${columnsData[2]}</span>`;
        }
        imageDiv += `</span>
            </a>
        </div>`;
        return imageDiv;
    } else {
        console.error(`Image miniature n'existe pas : ${htmlImg}`);
        return '';
    }
}

function getImageName(columnsData, type) {
    var imageName = columnsData[0]
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/-$/, '')
        .replace('-early-access', '')
        .replace('-alpha', '')
        .replace('-beta', '')
        .replace('-closed', '');
    if (type == 'events') {
        imageName += '-' + columnsData[1];
    }
    return imageName;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }
        try {
            oAuth2Client.setCredentials(JSON.parse(token));
        } catch (exception) {
            logErrorIfDebug('Error parsing token file', exception);
        }
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return console.error(
                    'Error while trying to retrieve access token',
                    err
                );
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err2) => {
                if (err2) {
                    return console.error(err2);
                }
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function print(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
            spreadsheetId: '1qRqKggPFYto2UyAYh8U66Z9pnXpmwbmwHkfwsMZrLZU',
            range: "Zhykos'screenshots!A4:G",
        },
        (errScreenshots, resScreenshots) => {
            if (errScreenshots) {
                return console.log(
                    'The API returned an error: ' + errScreenshots
                );
            }
            const rowsScreenshots = resScreenshots.data.values;
            if (rowsScreenshots.length) {
                sortArray(rowsScreenshots);

                sheets.spreadsheets.values.get({
                        spreadsheetId: '1qRqKggPFYto2UyAYh8U66Z9pnXpmwbmwHkfwsMZrLZU',
                        range: 'Events!A4:E',
                    },
                    (errEvents, resEvents) => {
                        if (errEvents) {
                            return console.log(
                                'The API returned an error: ' + errEvents
                            );
                        }
                        const rowsEvents = resEvents.data.values;
                        if (rowsEvents.length) {
                            sortArray(rowsEvents);
                            printPage(rowsScreenshots, rowsEvents);
                        } else {
                            console.log('Events: no data found.');
                        }
                    }
                );
            } else {
                console.log('Screenshots: no data found.');
            }
        }
    );
}

function sortArray(array) {
    array.sort(function(obj1, obj2) {
        return obj1[0] < obj2[0];
    });
}