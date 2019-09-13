'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const { CONFIG, SECTIONS } = require('./questionnaire');

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
        // TODO: see if user has already started questionnaire (so we can jump to
        //  appropriate section etc.)
        
        // Launch questionnaire from beginning
        this.followUpState('TakingQuestionnaire')
            .ask(CONFIG.intro);
    },

    TakingQuestionnaire: {
        // First activated by responding yes to consent question.
        // Then continually activated by Alexa dialog fulfillment.
        SurveyQuestionIntent() {
            // If we haven't yet begun the questionnaire
            if (!this.$session.$data.questionnaireState) {
                console.log("New questionnaire session created.");
                this.$session.$data.questionnaireState = { sectionId: SECTIONS.__main__, questionId: 0 };

                // back-up old questionnaire responses (if they exist)
                if (this.$user.$data.questionnaire) {
                    if (!this.$user.$data.previousResponses) {
                        this.$user.$data.previousResponses = [];
                    }
                    this.$user.$data.previousResponses.push(this.$user.$data.questionnaire);
                }

                // create new questionnaire state in database
                this.$user.$data.questionnaire = {
                    __start_time__: (new Date()).toISOString()
                };
            }

            const { sectionId, questionId } = this.$session.$data.questionnaireState;
            const section = SECTIONS[sectionId];

            if (!this.$user.$data.questionnaire[sectionId]) {
                this.$user.$data.questionnaire[sectionId] = {};
            }

            if (!section) {
                console.error('Failed to find section with id', sectionId);
                this.tell('Sorry, there was an issue loading the questionnaire.');
                return;
            }
            
            const { questions } = section;

            // If a question was just asked, handle the given response.
            if (questionId > 0) {
                const lastQuestion = questions[questionId-1];
                // Get the input slot with the last question's type
                const type = lastQuestion.type;
                const lastAnswer = this.$inputs[type.name].value;
                // Validate answer, if repromptStr is set, slot is invalid
                const repromptStr = type.validate && type.validate(lastAnswer);
                if (typeof repromptStr === 'string') {
                    this.$alexaSkill.$dialog.elicitSlot(type.name, repromptStr);
                    return;
                }

                // Save the answer since it is valid.
                console.log(`Response to last question '${lastQuestion.name}' was '${lastAnswer}'.`);
                this.$user.$data.questionnaire[section.name][lastQuestion.name] = lastAnswer;

                // Call the questions onResponse handler
                const redirectTo = lastQuestion.onResponse && lastQuestion.onResponse(lastAnswer);

                // If the response handler returned a section name, redirect to it
                if (typeof redirectTo === 'string') {
                    this.$session.$data.questionnaireState = { sectionId: redirectTo, questionId: 0 };
                    return this.toStateIntent("TakingQuestionnaire", "SurveyQuestionIntent");
                }
            }

            // If we are out of questions in this section, then the section is complete.
            if (!questions[questionId]) {
                // 
                const {next} = section;
                if (!next) {
                    // If there is not a 'next' section, questionnaire is over.
                    this.tell(CONFIG.completed);
                    this.$user.$data.questionnaire.__finished__ = true;
                    return;
                }

                // If there is a next session, jump to that.
                this.$session.$data.questionnaireState = { sectionId: next, questionId: 0 };
                // Re-run current intent with new questionnaire state.
                return this.toStateIntent("TakingQuestionnaire", "SurveyQuestionIntent");
            }

            const question = questions[questionId];
            // Elicit value of appropritate slot based on question type
            this.$alexaSkill.$dialog.elicitSlot(question.type.name, question.prompt, question.reprompt);
            // Move state to the next question
            this.$session.$data.questionnaireState= { sectionId, questionId: questionId + 1 };
        }
    },
    

    Unhandled() {
        this.tell('Sorry, I don\'t understand.');
    },
});

module.exports.app = app;
