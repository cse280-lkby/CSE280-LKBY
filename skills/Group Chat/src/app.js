'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);

// Firebase setup
const admin = require("firebase-admin");
const serviceAccount = require("./firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://collegebuddygroupchat.firebaseio.com"
});

const HARDCODED_DEMO_FCM_TOKEN = 'cgyxXJzU7pQ:APA91bHC_GeWVpTJYeua3dZhhazXxpXcuCPxPfCXNZXcVDf5BO-jrAlnzyccU1mAAB5PdcWHHscs68xFuSw5fMwqyHCxFRBsAey9aGfmtniieID2uCJkf4YKx_a66nDjmfSAJ17IJURt';
const HARDCODED_DEMO_NOTIFICATION = {
    notification: {
        title: 'My Support Group',
        body: 'Click to open your support group chat!'
    },
    data: {
        some: 'data'
    },
    token: HARDCODED_DEMO_FCM_TOKEN
};

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    LAUNCH() {
        // TODO enroll users, store their amazon ID + firebase token ID
        admin.messaging().send(HARDCODED_DEMO_NOTIFICATION).then(response => {
            console.log('Successfully sent notification', response);
        }).catch(err => {
            console.log('Failed to send notification!', err);
        });
        this.tell('I\'m sending a notification to your phone now, please click on it to join the group chat.');
    },

    Unhandled() {
        this.tell('Sorry, I don\'t understand.');
    },
});

module.exports.app = app;
