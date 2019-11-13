'use strict';

const process = require('process');
const PORT = process.argv[2] && Number(process.argv[2]) || 80;

const DialogueFramework = require('./dialogue-framework');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());

// TODO save this somewhere, maybe reuse jovo filedb
let userDataTable = {};
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
        finished: false,
        message: null,
        suggestions: [],
    };

    const ask = (_slotName, prompt, _reprompt, suggestions) => {
        response.message = prompt;
        response.suggestions = suggestions || [];
    };
    const getSlot = (_slotName) => {
        return message;
    }
    const tell = (speech) => {
        response.message = speech;
        response.finished = true;
        sessionDataTable[sessionID] = {};
    };

    const userData = userDataTable[userID];
    const sessionData = sessionDataTable[sessionID];
    await DialogueFramework.handle({ask, getSlot, tell, userData, sessionData});
    return response;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// enable pre-flight CORS 
app.options('/sendMessage', cors());

app.post('/sendMessage', async (req, res) => {
    console.log('Serving request', req.body);
    const request = req.body;
    if (!request) {
        res.sendStatus(500);
        return;
    }
    const {userID, sessionID, message} = request;
    if (!userID || !sessionID || !message) {
        res.sendStatus(500);
        return;
    }
    const response = await handleMessage(userID, sessionID, message);
    res.send(response);
});

// Temporary function for dumping entire user data table
app.get('/dump', async (_req, res) => {
    res.send(JSON.stringify(userDataTable));
});

// Temporary function for setting entire user data table
app.post('/dump', async (req, res) => {
    userDataTable = req.body;
    res.send('ok');
});

app.use(express.static('../../text-interface/build'));

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));