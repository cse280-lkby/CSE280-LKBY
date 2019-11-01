'use strict';

const PORT = 8080;

const DialogueFramework = require('./dialogue-framework');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// TODO save this somewhere, maybe reuse jovo filedb
const userDataTable = {};
const sessionDataTable = {};

async function handleMessage(userID, sessionID, message) {
    if (!userDataTable[userID]) {
        userDataTable[userID] = {};
    }
    if (!sessionDataTable[sessionID]) {
        sessionDataTable[sessionID] = {};
    }

    // TODO implement suggestions, indicate end of conversation?
    const response = {
        message: null,
        suggestions: [],
    };

    const ask = (_slotName, prompt, _reprompt) => {
        response.message = prompt;
    };
    const getSlot = (_slotName) => {
        return message;
    }
    const tell = (speech) => {
        this.tell(speech);
    };

    const userData = userDataTable[userID];
    const sessionData = sessionDataTable[sessionID];
    await DialogueFramework.handle({ask, getSlot, tell, userData, sessionData});
    return response;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/sendMessage', async (req, res) => {
    const request = req.body;
    if (!request) {
        res.sendStatus(500);
    }
    const {userID, sessionID, message} = request;
    if (!userID || !sessionID || !message) {
        res.sendStatus(500);
    }
    const response = await handleMessage(userID, sessionID, message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(response);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));