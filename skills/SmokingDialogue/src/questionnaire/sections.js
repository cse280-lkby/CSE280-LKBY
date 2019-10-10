const SLOT_TYPES = require('./slot-types');

const DAYS_UNTIL_CONSIDERED_QUIT = 4;

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

    // ======== INTRO AND MAIN METHODS ========

    // Runs before the questionnaire actually starts.
    // This should not modify userData or context, it should
    // only READ this.userData and you should return
    // a string which the user will answer "yes" to.
    // Ex: "Welcome back, " + this.userData.name + ", ready to get started?"
    // (Make sure to have a fallback if name is not set)
    __intro__() {
        const {onboarded, smokeOrVape} = this.userData;
        if (onboarded) {
            let phrase = 'Ready to get started?';
            if (smokeOrVape === 'vape') {
                phrase = 'Ready to kick that vaping habit?';
            }
            if (smokeOrVape === 'smoke') {
                phrase = 'Ready to kick that smoking habit?';
            }
            return 'Welcome back! ' + phrase;
        }
        return 'Hi there, welcome to the smoking dialogue! '
            + 'Are you ready to get started?';
    },

    // Decide which section to run first.
    __main__() {
        let {onboarded, quitDate} = this.userData;
        // Check if the user has been onboarded yet
        if (!onboarded) {
            return 'onboarding';
        }

        // Prompt the user to set a quit date
        if (!quitDate) {
            return 'set_quit_date';
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

    // ======== ONBOARDING SECTIONS ========

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
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. Do you usually smoke or vape?',
                    };

                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    console.log('Got response from Wit API!', JSON.stringify(witResponse));

                    //Initializes default values for the context smoke_or_vape and pod_or_pack
                    this.userData.smokeOrVape = 'smoke';
                    const {smoke_or_vape} = witResponse.entities;
                    if (smoke_or_vape != null) {
                        const response = smoke_or_vape[0].value;
                        console.log('Value:', response);
                        this.userData.smokeOrVape = response;
                    }
                }
            },{
                name: 'date_last_smoked',
                prompt() {
                    return 'When was the last time you ' + this.userData.smokeOrVape + 'd?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. When was the last time you ' + this.userData.smokeOrVape + 'd?',
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
                    const date = new Date(dateStr);
                    console.log('Raw date: ', dateStr, ", parsed: ", date);
                    this.userData.dateLastSmoked = date;

                    if (date.getTime() > Date.now()) {
                        return errorResponse;
                    }

                    const alreadyQuitDate = new Date();
                    alreadyQuitDate.setDate(alreadyQuitDate.getDate() - DAYS_UNTIL_CONSIDERED_QUIT);

                    if (date.getTime() <= alreadyQuitDate.getTime()) {
                        console.log("Already quit.");
                        return {
                            response: 'Awesome! Sounds like you quit already!', 
                            next: "already_quit"
                        };
                    }
                }
            },{
                name: 'duration_of_pod_or_pack',
                prompt() { 
                    return 'How long does a single '
                        + (this.userData.smokeOrVape === 'vape' ? 'pod' : 'pack')
                        + ' usually last for you?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. How long does a single '
                        + (this.userData.smokeOrVape === 'vape' ? 'pod' : 'pack')
                        + ' usually last for you?',
                    };

                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {duration} = witResponse.entities;
                    if (duration == null) {
                        return errorResponse;
                    }
                    // Normalized duration value is in seconds
                    this.userData.podOrPackDuration = duration[0].normalized.value;
                }
            },{
                name: 'reason_for_smoking',
                prompt() {
                    return 'Here\'s a question you probably weren\'t expecting, what made you start '
                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking') + '?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_smoking} = witResponse.entities;
                        if (reasons_for_smoking != null) {
                            const reason = reasons_for_smoking[0].value;
                            this.userData.reasonForSmoking = reason;
                        }
                    }
                }
            },{
                name: 'reason_for_quitting',
                prompt: 'I\'m wondering if a recent event inspired you to quit. What are your main reasons for quitting now?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        this.userData.onboarded = true; //Set onboarded to true
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {reasons_for_quitting} = witResponse.entities;
                        if (reasons_for_quitting != null) {
                            const reason = witResponse.entities.reasons_for_quitting[0].value;
                            console.log('Value:', reason);
                            this.userData.reasonForQuitting = reason;
                        }
                    }
                    
                    let resp = '';
                    const {reasonForSmoking, reasonForQuitting} = this.userData;
                    if(reasonForSmoking != null) {
                        resp += 'I see that you started smoking because of '
                        + this.userData.reasonForSmoking + '. ';
                    }
                    if(reasonForQuitting != null) {
                        resp += 'You want to quit smoking because of '
                        + this.userData.reasonForQuitting + '. '
                    }
                    resp += 'Next, let\'s decide on a quit date.';

                    return {
                        response: resp,
                    };
                }
            },
        ],
        next: 'set_quit_date' //TODO: Should we ask if the user wants to set a quit date right now?
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
                            response: 'How about a date a little further in the future?',
                        }
                    }

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

    // ======== QUIT DATE PASSED SECTIONS ========

    quit_date_passed: {
        name: 'quit_date_passed',
        questions: [
            {
                name: 'quit_date_passed',
                prompt: 'Hey it looks like your quit date has passed, how did it go?',
                type: SLOT_TYPES.OPEN_ENDED, //TODO: use wit.ai to parse out different "slots" of data to form a response
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t catch that. How did your quit attempt go?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {outcome} = witResponse.entities;
                    if (outcome == null || outcome[0].confidence < .85) {
                        // Response was not understood properly. Redirect
                        // to a simple yes or no question 
                        console.error('Did not understand quit_date_passed response');
                        return 'quit_date_passed_unclear_response';
                    }

                    //TODO: what if the person says something like "It didn't go well, I ended up relapsing, but I'm optimistic about trying again!"
                    //In other words, negative for current attempt but positive for future attempts/overall. Need to tell the difference
                    if (outcome[0].value === 'positive') {
                        // 'positive' outcome indicates that the user successfully quit.
                        // TODO: coaching and emotion parsing
                        return {
                            response: 'I\'m so glad to hear that you were able to quit! '
                                + 'If you ever need someone to talk to I will always be here. '
                                + 'I\'d like to ask you some questions about your experience so that '
                                + 'we may be able to help others in the future.',
                            next: 'already_quit',
                        }
                    }
                    else {
                        // 'negative' outcome indicates a relapse
                        return {
                            response: 'Don\'t feel bad! Quitting can be unbelievably hard. '
                                + 'For most, it takes multiple attempts before they successfully quit. '
                                + 'The best thing you can do is try again as soon as you feel ready. '
                                + 'I know you can do it!',
                            next: 'quit_attempt_failed',
                        }
                    }
                }
            }
        ],
        next: ''
    },

    //TODO: this could be made into a generic function with context strings "yesResponse" and "noResponse"
    quit_date_passed_unclear_response: {
        name: 'quit_date_passed_unclear_response',
        questions: [
            {
                name: 'quit_successfully',
                prompt: 'Sorry, I\'m still learning and didn\'t understand that fully. '
                    + 'Was your quit attempt successful?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'yes') {
                        return {
                            response: 'I\'m so glad to hear that you were able to quit! '
                                + 'If you ever need someone to talk to I will always be here. '
                                + 'I\'d like to ask you some questions about your experience so that '
                                + 'we may be able to help others in the future.',
                            next: 'already_quit',
                        }
                    } else {
                        return {
                            response: 'Don\'t feel bad! Quitting can be unbelievably hard. '
                                + 'For most, it takes multiple attempts before they successfully quit. '
                                + 'The best thing you can do is try again as soon as you feel ready. '
                                + 'I know you can do it!',
                            next: 'quit_attempt_failed',
                        }
                    }
                }
            }
        ]
    },

    quit_attempt_failed: {
        name: 'quit_attempt_failed',
        questions: [
            {
                name: 'quit_attempt_thoughts',
                prompt: 'What was going through your head as you attempted to quit?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    // TODO coach based on recognized responses
                    return {
                        response: 'I completely understand. That is a very common experience '
                            + 'but I know you can do this. I think we should get you back on '
                            + 'the wagon.',
                        next: 'set_quit_date'
                    };
                }
            }
        ]
    },

    // If the user has already quit. Collects some data on what worked and didn't work in case they relapse.
    already_quit: {
        name: 'already_quit',
        questions: [
            {
                name: 'successful_quitting_aid',
                prompt: 'What quitting aids worked the best for you?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. What quitting aid would you like to use?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {quitting_aids} = witResponse.entities;
                    if (quitting_aids == null) {
                        return errorResponse;
                    }
                    // Store quitting aids as an array of values
                    this.userData.successfulQuittingAids = quitting_aids.map(ent => ent.value);
                }
                //TODO: additional questions and coaching
            }
        ],
        next: ''
    },

    // ======== QUIT DATE UPCOMING SECTIONS ========

    quit_date_upcoming: {
        name: 'quit_date_upcoming',
        questions: [
            {
                name: 'quit_date_upcoming_emotion',
                prompt: 'Hey, it looks like your quit date is coming up soon. How are you feeling about it?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t catch that. How are you feeling?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {emotion} = witResponse.entities;
                    if (emotion == null) {
                        return errorResponse;
                    }

                    // Parse out the type of emotion said and build the response string accordingly.
                    const feeling = emotion[0].value;
                    this.userData.quitDateUpcomingFeeling = feeling;

                    let res = 'You\'re going to do great!';
                    if (feeling === 'positive') {
                        res = 'Awesome! I\'m looking forward to seeing your progress! ' + res;
                    } else if(feeling === 'nervous') {
                        res = 'No need to feel nervous. ' + res;
                    } else {
                        res = 'I\'ll be here for you every step of they way. ' + res;
                    }
                    return {
                        response: res,
                        next: 'quitting_aids'
                    }
                }
            },
        ],
        next: 'quitting_aids',
    },
    quitting_aids: { // TODO: How to implement allowing users to ask for more info on different methods?
        name: 'quitting_aids',
        questions: [
            {
                name: 'has_method_to_try', //use wit.ai to parse out specific methods (or a no response) and act accordingly
                prompt: 'I think we should talk about what method you want to use to quit. Some people like to use '
                    + 'a quitting aid such as gum, patches or medication. Others prefer to quit cold turkey. Have you '
                    + 'thought about what method you would like to use to quit? If so, what method will you try?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. What quitting aid would you like to use?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {no} = witResponse.entities;
                    if (no != null) {
                        // TODO explain the different types of quitting aids
                        return {
                            response: 'That\'s okay! Think about it and we\'ll come back to this another time.',
                            next: 'planning'
                        }
                    }
                    const {quitting_aids} = witResponse.entities;
                    if (quitting_aids == null) {
                        return errorResponse;
                    }
                    this.userData.quittingAid = quitting_aids[0].value;
                    console.log('Got quitting_aid from Wit: ', this.userData.quittingAid);
                    return {
                        response: this.userData.quittingAid + ' is a great idea!',
                        next: 'planning'
                    }
                }
            }
        ],
        next: '' // 'planning'
    },
    // TODO: more coaching!
    planning: {
        name: 'planning',
        questions: [
            {
                name: 'top_triggers',
                // TODO: Can this be customized to list *what the client likes about smoking*
                prompt: 'Let\'s do some plannning for the situations where you usually smoke. What are some of your top triggers?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: ''
    },

    __version__: '1',
};

module.exports = SECTIONS;