const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) {
        return console.log('Error loading client secret file:', err);
    }
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), print);
});


function printPage(rows) {
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
                Index: <a
                    href="https://docs.google.com/spreadsheets/d/1qRqKggPFYto2UyAYh8U66Z9pnXpmwbmwHkfwsMZrLZU/edit?usp=sharing">Google
                    Sheet</a><br />
                Go back to main website: <a href="./index.html">Zhykos.fr</a><br />
            </div>
            <div class="heading">
                <h3>Thomas "Zhykos"'screenshots</h3>
            </div>
            <div class="row no-gutters">`;
    rows.map((row) => {
        page += printOneGame(row);
    });
    page += `
            </div>
        </div>
    </section>
    <section class="footer">
        <div>Logo made from 2 icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a
                href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    </section>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/baguettebox.js/1.10.0/baguetteBox.min.js"></script>
    <script>
        baguetteBox.run('.compact-gallery', { animation: 'slideIn' });
    </script>
</body>

</html>`;
    fs.writeFile('../video-game-gallery.html', page, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log('Fichier écrit.');
    });
}

function printOneGame(columnsStr) {
    const htmlImg = `assets/img/gallery/${getImageName(columnsStr[0])}.jpg`;
    if (fs.existsSync("../" + htmlImg)) {
        return `
        <div class="col-md-6 col-lg-3 item zoom-on-hover">
            <a class="lightbox"
                href="${columnsStr[4]}">
                <img class="img-fluid image"
                    src="${htmlImg}" />
                <span class="description">
                    <span class="description-heading">${columnsStr[0]}</span>
                    <span class="description-body">${columnsStr[1]} - ${columnsStr[2]} - ${columnsStr[3]}</span>
                </span>
            </a>
        </div>`;
    } else {
        console.error(`Image miniature n'existe pas : ${htmlImg}`);
        return "";
    }
}

function getImageName(gameName) {
    return gameName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '').replace("-early-access", '').replace("-alpha", '');
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
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
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
                return console.error('Error while trying to retrieve access token', err);
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    return console.error(err);
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
        range: 'Zhykos\'screenshots!A4:G',
    }, (err, res) => {
        if (err) {
            return console.log('The API returned an error: ' + err);
        }
        const rows = res.data.values;
        if (rows.length) {
            sortArray(rows);
            printPage(rows);
        } else {
            console.log('No data found.');
        }
    });
}

function sortArray(array) {
    /*for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }*/
    array.sort(function (obj1, obj2) {
        return obj1[0] < obj2[0];
    });
}