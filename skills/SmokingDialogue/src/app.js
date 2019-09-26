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

let witClient = null;

if (CONFIG.witToken != null) {
    const { Wit } = require('node-wit');
    witClient = new Wit({accessToken: CONFIG.witToken});
}

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

function logUserEvent($user, event) {
    const time = Date.now();
    if (!$user.$data.eventLog) {
        $user.$data.eventLog = [];
    }
    $user.$data.eventLog.push({time, event});
    console.log("Logged event: ", event);
}

app.setHandler({
    LAUNCH() {
        logUserEvent(this.$user, "Started skill.");

        // Launch questionnaire from beginning
        this.followUpState('TakingQuestionnaire')
            .ask(CONFIG.intro);
    },

    TakingQuestionnaire: {
        // First activated by responding yes to consent question.
        // Then continually activated by Alexa dialog fulfillment.
        async SurveyQuestionIntent() {
            // If we haven't yet begun the questionnaire
            if (!this.$session.$data.questionnaireState) {
                logUserEvent(this.$user, "Started new questionnaire section.");

                // back-up old questionnaire responses (if they exist)
                if (this.$user.$data.questionnaire) {
                    if (!this.$user.$data.previousResponses) {
                        this.$user.$data.previousResponses = [];
                    }
                    this.$user.$data.previousResponses.push(this.$user.$data.questionnaire);
                }

                const curTime = (new Date()).toISOString();

                // create new questionnaire state in database
                this.$user.$data.questionnaire = {
                    __start_time__: curTime
                };

                // Back up old persistent userData, if exists
                const oldQUserData = this.$user.$data.qUserData;
                if (oldQUserData) {
                    if (!this.$user.$data.prevQUserData) {
                        this.$user.$data.prevQUserData = [];
                    }
                    this.$user.$data.prevQUserData.push(oldQUserData);
                }

                // Initialize new persistent user data for questionnaire
                this.$user.$data.qUserData = {
                    ...(oldQUserData || ({})),
                    __start_time__: curTime
                };

                // Initialize session context
                const context = {};
                const thisArg = { context, userData: this.$user.$data.qUserData };

                // Get the main section
                const mainSection = typeof SECTIONS.__main__ === 'function' 
                    ? SECTIONS.__main__.call(thisArg)
                    : SECTIONS.__main__;

                // Initialize the new questionnaire session
                this.$session.$data.questionnaireState = { 
                    context,
                    sectionId: mainSection,
                    questionId: 0
                };
            }

            const { qUserData } = this.$user.$data;
            const { context, prevResponse, sectionId, questionId } = this.$session.$data.questionnaireState;

            // Initialize the "this" arg passed to prompt and response handlers
            const thisArg = { context, userData: qUserData };

            // Reset the prev response if it exists
            if (prevResponse != null) {
                this.$session.$data.prevResponse = null;
            }

            const section = SECTIONS[sectionId];

            // Crash if section does not exist
            if (!section) {
                console.error('Failed to find section with id', sectionId);
                this.tell('Sorry, an error occurred. Let\'s try talking again soon.');
                return;
            }

            // Initialize questionnarie section data
            if (!this.$user.$data.questionnaire[sectionId]) {
                this.$user.$data.questionnaire[sectionId] = {};
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
                logUserEvent(this.$user, {
                    type: "Answered question",
                    section: section.name,
                    question: lastQuestion.name,
                    answer: lastAnswer
                });
                
                this.$user.$data.questionnaire[section.name][lastQuestion.name] = lastAnswer;

                // Send response to Wit API, if needed
                let witResponse = null;
                if (lastQuestion.useWit) {
                    try {
                        // Get the Wit response for the given input string
                        // TODO: pass context such as time zone, possibly maintain state
                        witResponse = await witClient.message(lastAnswer, {});
                        this.$user.$data.questionnaire[section.name][lastQuestion.name + "$wit"] = witResponse;
                    } catch (e) {
                        console.error('Wit API error:', e);
                    }
                }

                // Call the questions onResponse handler
                if (lastQuestion.onResponse != null) {
                    const responseResult = lastQuestion.onResponse.call(thisArg, lastAnswer, witResponse);

                    this.$session.$data.questionnaireState.prevResponse = responseResult && responseResult.response || null;

                    // If the response handler returned a section name, redirect to it
                    const redirectTo = typeof responseResult === 'string' ? responseResult : (responseResult && responseResult.next);
                    if (typeof redirectTo === 'string') {
                        this.$session.$data.questionnaireState.sectionId = redirectTo;
                        this.$session.$data.questionnaireState.questionId = 0;
                        return this.toStateIntent("TakingQuestionnaire", "SurveyQuestionIntent");
                    }
                }
            }

            // If we are out of questions in this section, then the section is complete.
            if (!questions[questionId]) {
                const {next} = section;
                if (!next) {
                    // If there is not a 'next' section, questionnaire is over.
                    const finalMessage = `${prevResponse && prevResponse + '. ' || ''}${CONFIG.completed}`;
                    this.tell(finalMessage);
                    this.$user.$data.questionnaire.__finished__ = true;
                    return;
                }

                // If there is a next section, jump to that.
                this.$session.$data.questionnaireState.sectionId = next;
                this.$session.$data.questionnaireState.questionId = 0;

                // Re-run current intent with new questionnaire state.
                return this.toStateIntent("TakingQuestionnaire", "SurveyQuestionIntent");
            }

            const question = questions[questionId];

            // The prompt for this question
            const questionPrompt = typeof question.prompt === 'function'
                ? question.prompt.call(thisArg)
                : question.prompt;

            // The previous response (if given) plus the prompt for this question.
            const nextPrompt = `${prevResponse ? prevResponse + '. ' : ''}${questionPrompt}`;

            // Elicit value of appropritate slot based on question type
            this.$alexaSkill.$dialog.elicitSlot(question.type.name, nextPrompt, question.reprompt);

            // Move state to the next question
            this.$session.$data.questionnaireState.questionId++;
        }
    },
    

    Unhandled() {
        this.tell('Sorry, I don\'t understand.');
    },
});

module.exports.app = app;
