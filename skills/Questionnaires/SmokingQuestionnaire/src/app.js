'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const SECTIONS = require('./questionnaire/sections');

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
            .ask('Welcome to the Smoking Questionnaire. Before we start, I need'
            + ' permission to collect and save information from our conversation.'
            + ' You can view the full privacy policy on our skill information page.'
            + ' Do you consent to have your answers saved for research purposes?');
    },

    TakingQuestionnaire: {
        // First activated by responding yes to consent question.
        // Then continually activated by Alexa dialog fulfillment.
        SurveyQuestionIntent() {
            // If we haven't yet begun the questionnaire
            if (!this.$session.$data.questionnaireState) {
                console.log("New questionnaire session created.");
                this.$session.$data.questionnaireState = { sectionId: SECTIONS.__main__, questionId: 0 };
            }

            const { sectionId, questionId } = this.$session.$data.questionnaireState;
            const section = SECTIONS[sectionId];

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
                const lastAnswer = this.$inputs[lastQuestion.type].value;
                // TODO: run callback so we can verify/reprompt or jump to different state
                // TODO: configure if answers should be saved
                this.$user.$data[lastQuestion.name] = lastAnswer;
                console.log(`Response to last question '${lastQuestion.name}' was '${lastAnswer}'.`);
            }

            // If we are out of questions in this section, then the section is complete.
            if (!questions[questionId]) {
                // 
                const {next} = section;
                if (!next) {
                    // If there is not a 'next' section, questionnaire is over.
                    this.tell('That\'s all we have for now. Thank you for taking the questionnaire!');
                    return;
                }

                // If there is a next session, jump to that.
                this.$session.$data.questionnaireState = { sectionId: next, questionId: 0 };
                // Re-run current intent with new questionnaire state.
                return this.toStateIntent("TakingQuestionnaire", "SurveyQuestionIntent");
            }

            const question = questions[questionId];
            // Elicit value of appropritate slot based on question type
            this.$alexaSkill.$dialog.elicitSlot(question.type, question.prompt, question.reprompt);
            // Move state to the next question
            this.$session.$data.questionnaireState= { sectionId, questionId: questionId + 1 };
        }
    },
    

    Unhandled() {
        this.tell('Sorry, I don\'t understand.');
    },
});

module.exports.app = app;
