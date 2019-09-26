const SLOT_TYPES = require('./slot-types');

/*
 * Sections:
 *  must contain a 'name', a list of 'questions' (at least 1), and can have a 'next'.
 *  Note: 'name' field must match the name of the key in the SECTIONS object.
 * 
 * Questions:
 *  must contain a 'name', 'prompt', 'type' (SLOT_TYPES.XXXX).
 *  Optional: 'useWit', 'reprompt', 'onResponse' (more below)
 *  Note: the first question has ID 0, second has ID 1, etc.
 * 
 * onResponse(value, witResponse?):
 *  Called when a question is answered.
 *  witResponse is either null or a Wit.ai response object if useWit=true.
 *  Possible returns:
 *   - A string to jump to a different section
 *   - An object with optional "response" and "next" properties.
 *   -   response: optional string spoken immediately before next question
 *   -   next: optional next state to jump to, if not set will do normal conversation flow
 *   -   reprompt: optional boolean indicating if the same question should be asked again
 *   - Nothing to continue normal conversation flow.
 */

// List of survey sections.
const SECTIONS = {
    // Decide which section to run first.
    __main__() {
        let {quitDate} = this.userData;
        if (!quitDate) {
            return 'onboarding';
        }

        // Convert quitDate to Date if it is not already
        if (typeof quitDate === 'string') {
            quitDate = new Date(quitDate);
        }

        // Check if quit date has passed
        if (Date.now() > quitDate.getTime()) {
            return 'quit_date_passed';
        }

        return 'quit_date_upcoming';
    },

    onboarding: {
        name: 'onboarding',
        questions: [
            {
                //Ask about whether you primarily smoke or vape. Use answer as context for rest of conversation
                name: 'vape_or_smoke',
                prompt: 'To start off, I\'d like to learn more about you. Do you primarily smoke or vape?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if(witResponse != null && witResponse.entities != null) {
                        //Initializes default values for the context smoke_or_vape and pod_or_pack
                        this.context.smoke_or_vape = 'smoke';
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {smoke_or_vape} = witResponse.entities;
                        if (smoke_or_vape != null) {
                            const response = witResponse.entities.smoke_or_vape[0].value;
                            console.log('Value:', response);
                            this.context.smoke_or_vape = response;
                        }
                    }
                }
            },{
                name: 'date_last_smoked',
                prompt() { return 'When was the last time you ' + this.context.smoke_or_vape + 'd?' },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {quit_date} = witResponse.entities;
                        if (quit_date != null) {
                            const dateStr = witResponse.entities.quit_date[0].value;
                            const date = new Date(dateStr);
                            console.log('Raw date: ', dateStr, ", parsed: ", date);
                            this.context.date_last_smoked = date;

                            const day_before_yesterday = new Date();
                            day_before_yesterday.setDate(day_before_yesterday.getDate() - 2);

                            if (date.getTime() <= day_before_yesterday.getTime()) {
                                console.log("Already quit.");
                                return {
                                    response: 'Awesome! Sounds like you quit already!', 
                                    next: "already_quit"
                                };
                            }
                        }
                    }
                }
            },{
                name: 'duration_of_pod_or_pack',
                prompt() { 
                    return 'How long does a single '
                        + (this.context.smoke_or_vape === 'vape' ? 'pod' : 'pack')
                        + ' usually last for you?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {duration} = witResponse.entities;
                        if (duration != null) {
                            // Normalized duration value is in seconds
                            this.context.pod_or_pack_duration_sec = duration[0].normalized.value;
                        }
                    }
                }
            },{
                name: 'reason_for_smoking',
                prompt() {
                    return 'Here\'s a question you probably weren\'t expecting, what made you start '
                        + (this.context.smoke_or_vape === 'vape' ? 'vaping' : 'smoking') + '?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    this.context.reason_for_smoking = "you wanted to.";
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_smoking} = witResponse.entities;
                        if (reasons_for_smoking != null) {
                            const reason = witResponse.entities.reasons_for_smoking[0].value;
                            console.log('Value:', reason);
                            this.context.reason_for_smoking = reason;
                        }
                    }
                }
            },{
                name: 'reason_for_quitting',
                prompt: 'I\'m wondering if a recent event inspired you to quit. What are your main reasons for quitting now?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    this.context.reason_for_quitting = "you wanted to.";
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_quitting} = witResponse.entities;
                        if (reasons_for_quitting != null) {
                            const reason = witResponse.entities.reasons_for_quitting[0].value;
                            console.log('Value:', reason);
                            this.context.reason_for_quitting = reason;
                        }
                    }
                    return {
                        response: 'I see that you started smoking because of '
                            + this.context.reason_for_smoking
                            + '. You want to quit smoking because of '
                            + this.context.reason_for_quitting + '.',
                    };
                }
            },
        ],
        next: 'set_quit_date'
    },

    set_quit_date: {
        name: 'set_quit_date',
        questions: [
            {
                name: 'quit_date',
                prompt: 'By which date would you like to quit?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. By which date would you like to quit?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));

                    const {quit_date} = witResponse.entities;
                    if (quit_date == null) {
                        return errorResponse;
                    }

                    const dateStr = quit_date[0].value;
                    if (quit_date == null) {
                        return errorResponse;
                    }

                    const date = new Date(dateStr);
                    console.log('Raw date: ', dateStr, ", parsed: ", date);
                    if (date.getTime() <= Date.now()) {
                        return {
                            reprompt: true,
                            response: 'Sorry, I think that date is in the past.',
                        }
                    }

                    this.context.quitDate = date;
                    this.userData.quitDate = date;

                    return {
                        response: 'Sounds great. I\'m looking forward to helping you quit by '
                            + date.toLocaleString('en-US', { month: 'long', day: 'numeric' })
                            + '! Let\'s talk again soon!',
                    }
                }
            }
        ],
        next: ''
    },

    quit_date_passed: {
        name: 'quit_date_passed',
        questions: [
            {
                // TODO quit_date_passed questions
                name: 'quit_date_passed',
                prompt: 'Hey, how did your quit attempt go?',
                type: SLOT_TYPES.OPEN_ENDED, //TODO: use wit.ai to parse out different "slots" of data to form a response
                //Ask different questions depending on whether the user succeeded or not
            }
        ],
        // next: null
    },

    quit_date_upcoming: {
        name: 'quit_date_upcoming',
        questions: [
            {
                name: 'quit_date_upcoming_emotion',
                prompt: 'Hey, it looks like your quit date is coming up soon. How are you feeling about it?',
                type: SLOT_TYPES.OPEN_ENDED, //TODO: make a empathetic response with wit.ai
            },
        ],
        next: 'quitting_aids',
    },
    quitting_aids: { // TODO: How to implement allowing users to ask for more info on different methods?
        name: 'quitting_aids',
        questions: [
            {
                name: 'has_method_to_try', //TODO: use wit.ai to parse out specific methods (or a no response) and act accordingly
                prompt: 'Now let’s talk about what method you want to use to quit. Some people like to use ' +
                'a quit aid (like gum, patches or medication) and others prefer to quit cold turkey. Have you ' +
                'thought about what method you would like to use to quit? If so, what quitting aid would you like to use?',
                type: SLOT_TYPES.OPEN_ENDED,
            }
        ],
        next: 'planning'
    },
    // Helper for when user responds that they know which method they want to use
    /*quitting_aids_helper: { //TODO: reformat back into quitting_aids (possible?)
        name: 'quitting_aids_helper',
        questions: [
            {
                name: 'quitting_aid',
                prompt: 'What quitting aid would you like to use?',
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: 'planning'
    },*/
    planning: {
        name: 'planning',
        questions: [
            {
                name: 'first_top_trigger',
                // TODO: Can this be customized to list *what the client likes about smoking*
                prompt: 'Let\'s do some plannning for the situations where you usually smoke. What is your top trigger?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'second_top_trigger',
                prompt: 'What is your second top trigger?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'third_top_trigger',
                prompt: 'What is your third top trigger?',
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: ''
    },

    //gathers information about the user's preferences, recent usage history, and motivation
    /*motivation: {
        name: 'motivation',
        questions: [
            {
                //Ask about whether you primarily smoke or vape. Use answer as context for rest of conversation
                name: 'vape_or_smoke',
                prompt: 'Do you primarily smoke or vape?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if(witResponse != null && witResponse.entities != null) {
                        //Initializes default values for the context smoke_or_vape and pod_or_pack
                        this.context.smoke_or_vape = 'smoke';
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {smoke_or_vape} = witResponse.entities;
                        if (smoke_or_vape != null) {
                            const response = witResponse.entities.smoke_or_vape[0].value;
                            console.log('Value:', response);
                            this.context.smoke_or_vape = response;
                        }
                    }
                }
            },{
                name: 'date_last_smoked',
                prompt() { return 'When was the last time you ' + this.context.smoke_or_vape + 'd?' },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {quit_date} = witResponse.entities;
                        if (quit_date != null) {
                            const dateStr = witResponse.entities.quit_date[0].value;
                            const date = new Date(dateStr);
                            console.log('Raw date: ', dateStr, ", parsed: ", date);
                            this.context.date_last_smoked = date;

                            const day_before_yesterday = new Date();
                            day_before_yesterday.setDate(day_before_yesterday.getDate() - 2);

                            if (date.getTime() <= day_before_yesterday.getTime()) {
                                console.log("Already quit.");
                                return {
                                    response: 'Awesome! Sounds like you quit already!', 
                                    next: "already_quit"
                                };
                            }
                        }
                    }
                }
            },{
                name: 'duration_of_pod_or_pack',
                prompt() { 
                    return 'How long does a single '
                        + (this.context.smoke_or_vape === 'vape' ? 'pod' : 'pack')
                        + ' usually last for you?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {duration} = witResponse.entities;
                        if (duration != null) {
                            // Normalized duration value is in seconds
                            this.context.pod_or_pack_duration_sec = duration[0].normalized.value;
                        }
                    }
                }
            },{
                name: 'reason_for_smoking',
                prompt() {
                    return 'Here\'s a question you probably weren\'t expecting, what made you start '
                        + (this.context.smoke_or_vape === 'vape' ? 'vaping' : 'smoking') + '?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    this.context.reason_for_smoking = "you wanted to.";
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_smoking} = witResponse.entities;
                        if (reasons_for_smoking != null) {
                            const reason = witResponse.entities.reasons_for_smoking[0].value;
                            console.log('Value:', reason);
                            this.context.reason_for_smoking = reason;
                        }
                    }
                }
            },{
                name: 'reason_for_quitting',
                prompt: 'I\'m wondering if a recent event inspired you to quit. What are your main reasons for quitting now?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    this.context.reason_for_quitting = "you wanted to.";
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_quitting} = witResponse.entities;
                        if (reasons_for_quitting != null) {
                            const reason = witResponse.entities.reasons_for_quitting[0].value;
                            console.log('Value:', reason);
                            this.context.reason_for_quitting = reason;
                        }
                    }
                    return {response: 'I see that you started smoking because of ' + this.context.reason_for_smoking +
                        '. You want to quit smoking because of ' + this.context.reason_for_quitting, next: 'healthIssues'};
                }
            },
        ],
        next: 'healthIssues'
    },*/

    // If the user has already quit. Collects some data on what worked and didn't work in case they relapse.
    // TODO Coaching
    already_quit: {
        name: 'already_quit',
        questions: [
            {
                name: 'reason_for_quitting',
                prompt: 'What methods were successful for you?',
                type: SLOT_TYPES.OPEN_ENDED
                //TODO: use wit.ai to match to different types of quitting methods
            }
        ],
        next: ''
    },
    /*healthIssues: {
        name: 'healthIssues',
        questions: [
            {
                name: 'has_other_issues',
                prompt: 'Do you have any other medical or health issues related to your smoking? Please answer yes or no.',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'medication';
                }
            },{
                name: 'other_issues',
                prompt: 'If you are comfortable sharing, can you briefly describe these issues?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'medication'
    },
    medication: {
        name: 'medication',
        questions: [
            {
                name: 'is_taking_medication',
                prompt: 'Are you currently taking medication for any reason? Please answer yes or no.',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not taking medication, skip to history section
                    if (input === 'no') return 'history';
                }
            },{
                name: 'taking_medication',
                prompt: 'What medication are you currently taking?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'history'
    },
    history: {
        name: 'history',
        questions: [
            {
                name: 'age_when_started',
                prompt: 'How old were you when you first started smoking regularly?',
                type: SLOT_TYPES.NUMBER
            },{
                name: 'previous_quit_attempts',
                prompt: 'Have you ever tried quitting before?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'yes') return 'quit_attempts';
                }
            },
        ],
        next: 'quitting_aids'
    },
    quit_attempts: {
        name: 'quit_attempts',
        questions: [
            // Last time quit smoking
            {
                name: 'date_stop_smoking_last',
                prompt: 'I\'m first going to ask you about the last time you quit smoking. When did you stop smoking?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'how_long_stopped_last',
                prompt: 'How long did you stop smoking?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'relapse_situation_last',
                prompt: 'What caused you to start smoking again?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                // TODO: Reprompt different examples
                name: 'methods_used_last',
                prompt: 'What methods for quitting did you try?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'is_last_longest',
                prompt: 'Is the last time you quit smoking the longest time you quit smoking?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input === 'yes') return 'quitting_aids';
                }
            },
            // Longest time quit smoking
            {
                name: 'date_stop_smoking_longest',
                prompt: 'Now, I\'ll ask about the longest time you quit smoking. When did you stop smoking?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'how_long_stopped_longest',
                prompt: 'How long did you stop smoking?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'relapse_situation_longest',
                prompt: 'What situation caused you to relapse?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                // TODO: Reprompt different examples
                name: 'methods_used_longest',
                prompt: 'What methods did you try?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'quitting_aids'
    },*/
    __version__: '1',
};

module.exports = SECTIONS;