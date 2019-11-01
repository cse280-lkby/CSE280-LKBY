'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const DialogueFramework = require('./dialogue-framework');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    LAUNCH() {
        const userData = this.$user.$data;
        const introText = DialogueFramework.intro({userData});
        
        // Launch questionnaire from beginning
        this.followUpState('TakingQuestionnaire')
            .ask(introText);
    },

    TakingQuestionnaire: {
        // First activated by responding yes to consent question.
        // Then continually activated by Alexa dialog fulfillment.
        async SurveyQuestionIntent() {
            const ask = (slotName, prompt, reprompt) => {
                this.$alexaSkill.$dialog.elicitSlot(slotName, prompt, reprompt);
            };
            const getSlot = (slotName) => {
                return this.$inputs[slotName].value;
            }
            const tell = (speech) => {
                this.tell(speech);
            };

            const userData = this.$user.$data;
            const sessionData = this.$session.$data;
            await DialogueFramework.handle({ask, getSlot, tell, userData, sessionData});
        }
    },
    

    Unhandled() {
        this.tell('Sorry, I don\'t understand.');
    },
});

module.exports.app = app;
