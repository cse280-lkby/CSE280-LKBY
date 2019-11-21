const { CONFIG, SECTIONS } = require('./questionnaire');
const { sentenceJoin } = require('./questionnaire/util');
const Events = require('./events');
//const {serializeError} = require('serialize-error');

let witClient = null;
if (CONFIG.witToken != null) {
    const { Wit } = require('node-wit');
    witClient = new Wit({ accessToken: CONFIG.witToken });
}

function logUserEvent(userData, type, data) {
    const time = Date.now();
    if (!userData.eventLog) {
        userData.eventLog = [];
    }
    userData.eventLog.push({ time, type, data });
    console.log("Logged event of type ", type, ": ", data);
}

function callIfFunction(obj, thisArg) {
    return typeof obj === 'function'
        ? obj.call(thisArg)
        : obj;
}

module.exports = {
    intro({userData}) {
        let intro = CONFIG.intro || 'Hi, ready to get started?';

        if (SECTIONS.__intro__ != null) {
            intro = callIfFunction(SECTIONS.__intro__, {
                userData: userData.qUserData || {}
            });
        }

        logUserEvent(userData, Events.SKILL_INVOKED, {
            intro,
        });

        return intro;
    },

    async handle({ask, getSlot, tell, userData, sessionData}) {
        try {
            // If we haven't yet begun the questionnaire
            if (!sessionData.questionnaireState) {
                logUserEvent(userData, Events.QUESTIONNAIRE_STARTED);

                // back-up old questionnaire responses (if they exist)
                if (userData.questionnaire) {
                    if (!userData.previousResponses) {
                        userData.previousResponses = [];
                    }
                    userData.previousResponses.push(userData.questionnaire);
                }

                const curTime = (new Date()).toISOString();

                // create new questionnaire state in database
                userData.questionnaire = {
                    __start_time__: curTime
                };

                // Back up old persistent userData, if exists
                const oldQUserData = userData.qUserData;
                if (oldQUserData) {
                    if (!userData.prevQUserData) {
                        userData.prevQUserData = [];
                    }
                    userData.prevQUserData.push(oldQUserData);
                }

                // Initialize new persistent user data for questionnaire
                userData.qUserData = {
                    ...(oldQUserData || ({})),
                    __start_time__: curTime
                };

                // Initialize session context
                const context = {};
                const thisArg = { context, userData: userData.qUserData };

                // Get the main section
                const mainSection = callIfFunction(SECTIONS.__main__, thisArg);

                // Initialize the new questionnaire session
                sessionData.questionnaireState = {
                    context,
                    sectionId: mainSection,
                    questionId: 0
                };
            }

            const { qUserData } = userData;
            const { context, prevResponse, sectionId, questionId } = sessionData.questionnaireState;

            // Initialize the "this" arg passed to prompt and response handlers
            const thisArg = { context, userData: qUserData };

            // Reset the prev response if it exists
            if (prevResponse != null) {
                sessionData.questionnaireState.prevResponse = null;
            }

            const section = SECTIONS[sectionId];

            // Crash if section does not exist
            if (!section) {
                throw new Error(`Failed to find section with id '${sectionId}'`);
            }

            // Initialize questionnarie section data
            if (!userData.questionnaire[sectionId]) {
                userData.questionnaire[sectionId] = {};
            }

            const { questions } = section;

            // If a question was just asked, handle the given response.
            if (questionId > 0) {
                const lastQuestion = questions[questionId - 1];
                // Get the input slot with the last question's type
                const type = lastQuestion.type;
                const lastAnswer = getSlot(type.name);
                // Log the response, even if invalid
                logUserEvent(userData, Events.USER_RESPONSE, {
                    section: section.name,
                    question: lastQuestion.name,
                    userResponse: lastAnswer,
                });
                // Validate answer, if repromptStr is set, slot is invalid
                let repromptStr = type.validate && type.validate(lastAnswer);
                const suggestions = callIfFunction(lastQuestion.suggestions, thisArg);
                if (typeof repromptStr === 'string') {
                    logUserEvent(userData, Events.REPROMPT, {
                        issue: 'question_type_mismatch',
                        prompt: repromptStr,
                        section: section.name,
                        question: lastQuestion.name,
                        suggestions
                    });
                    ask(type.name, repromptStr, repromptStr, suggestions);
                    return;
                }

                // Save the answer since it is valid.
                console.log(`Response to last question '${lastQuestion.name}' was '${lastAnswer}'.`);
                userData.questionnaire[section.name][lastQuestion.name] = lastAnswer;

                // Send response to Wit API, if needed
                let witResponse = null;
                if (lastQuestion.useWit) {
                    try {
                        // Get the Wit response for the given input string
                        // TODO: pass context such as time zone, possibly maintain state
                        witResponse = await witClient.message(lastAnswer, {});

                        logUserEvent(userData, Events.WIT_RESULT, {
                            userResponse: lastAnswer,
                            witData: witResponse,
                        });
                    } catch (e) {
                        console.error('Wit API error:', e);

                        logUserEvent(userData, Events.WIT_ERROR, {
                            userResponse: lastAnswer,
                            error: e.toString(),
                        });
                    }
                }

                // Call the questions onResponse handler
                if (lastQuestion.onResponse != null) {
                    const responseResult = lastQuestion.onResponse.call(thisArg, lastAnswer, witResponse);
                    if (responseResult != null) {
                        let redirectTo = null;
                        if (typeof responseResult === 'object') {
                            if (responseResult.reprompt) {
                                repromptStr = responseResult.response || responseResult.reprompt;
                                const suggestions = callIfFunction(lastQuestion.suggestions, thisArg);
                                logUserEvent(userData, Events.REPROMPT, {
                                    issue: 'handler_forced',
                                    prompt: repromptStr,
                                    section: section.name,
                                    question: lastQuestion.name,
                                    suggestions
                                });
                                ask(type.name, repromptStr, repromptStr, suggestions);
                                return;
                            }
                            if (responseResult.response) {
                                sessionData.questionnaireState.prevResponse = responseResult.response;
                                logUserEvent(userData, Events.HANDLER_RESPONSE, {
                                    response: responseResult.response,
                                });
                            }
                            if (responseResult.next) {
                                redirectTo = responseResult.next;
                            }
                        }
                        else if (typeof responseResult === 'string') {
                            redirectTo = responseResult;
                        }

                        // If the response handler returned a section name, redirect to it
                        if (redirectTo != null) {
                            sessionData.questionnaireState.sectionId = redirectTo;
                            sessionData.questionnaireState.questionId = 0;
                            logUserEvent(userData, Events.HANDLER_REDIRECT, {
                                section: redirectTo,
                            });
                            return await module.exports.handle({ask, getSlot, tell, userData, sessionData});
                        }
                    }
                }
            }

            // If we are out of questions in this section, then the section is complete.
            if (!questions[questionId]) {
                const { next } = section;
                if (!next) {
                    // If there is not a 'next' section, questionnaire is over.
                    // Note: prevResponse from questionnaireState should be said since this the last chance to do it.
                    const finalMessage = sentenceJoin([
                        prevResponse,
                        sessionData.questionnaireState.prevResponse,
                        CONFIG.completed
                    ]);

                    tell(finalMessage);
                    userData.questionnaire.__finished__ = true;

                    logUserEvent(userData, Events.QUESTIONNAIRE_FINISHED, {
                        finalMessage: CONFIG.completed,
                    });
                    return;
                }

                // If there is a next section, jump to that.
                sessionData.questionnaireState.sectionId = next;
                sessionData.questionnaireState.questionId = 0;

                // Re-run current intent with new questionnaire state.
                return await module.exports.handle({ask, getSlot, tell, userData, sessionData});
            }

            const question = questions[questionId];

            // The prompt for this question
            const questionPrompt = callIfFunction(question.prompt, thisArg);

            // The previous response (if given) plus the prompt for this question.
            const fullPrompt = sentenceJoin([
                prevResponse,
                questionPrompt
            ]);

            // The suggested answers
            const suggestions = callIfFunction(question.suggestions, thisArg);

            // Elicit value of appropritate slot based on question type
            ask(question.type.name, fullPrompt, question.reprompt, suggestions);

            logUserEvent(userData, Events.PROMPT, {
                section: section.name,
                question: question.name,
                prompt: questionPrompt,
                suggestions
            });

            // Move state to the next question
            sessionData.questionnaireState.questionId++;

        } catch (e) {
            logUserEvent(userData, Events.FATAL_CRASH, {
                error: serializeError(e),
                finalMessage: CONFIG.fatalError,
            });

            tell(CONFIG.fatalError);
        }
    }
};