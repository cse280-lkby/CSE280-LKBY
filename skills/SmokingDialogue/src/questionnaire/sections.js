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
    // Runs before the questionnaire actually starts.
    // This should not modify userData or context, it should
    // only READ this.userData and you should return
    // a string which the user will answer "yes" to.
    // Ex: "Welcome back, " + this.userData.name + ", ready to get started?"
    // (Make sure to have a fallback if name is not set)
    __intro__() {
        if (this.userData.onboarded) {
            return 'Welcome back! Ready to get started?';
        }
        return 'Hi there, welcome to the smoking dialogue! '
            + 'Are you ready to get started?';
    },

    // Decide which section to run first.
    __main__() {
        let {quitDate} = this.userData;
        let {onboarded} = this.userData;
        // Check if the user has been onboarded yet
        if (!onboarded) {
            return 'onboarding';
        }

        // Prompt the user to set a quit date
        if(!quitDate) {
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
                    this.context.smoke_or_vape = 'smoke';
                    const {smoke_or_vape} = witResponse.entities;
                    if (smoke_or_vape != null) {
                        const response = witResponse.entities.smoke_or_vape[0].value;
                        console.log('Value:', response);
                        this.context.smoke_or_vape = response;
                    }
                }
            },{
                name: 'date_last_smoked',
                prompt() { return 'When was the last time you ' + this.context.smoke_or_vape + 'd?' },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. When was the last time you ' + this.context.smoke_or_vape + 'd?',
                    };

                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {quit_date} = witResponse.entities;
                    if (quit_date == null) {
                        return errorResponse;
                    }
                    const dateStr = witResponse.entities.quit_date[0].value;
                    const date = new Date(dateStr);
                    console.log('Raw date: ', dateStr, ", parsed: ", date);
                    this.context.date_last_smoked = date;

                    if (date.getTime() > Date.now()) {
                        return {
                            reprompt: true,
                            response: 'Sorry, I think that date is in the future. When did you last ' + this.context.smoke_or_vape + '?',
                        }
                    }

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
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. How long does a single '
                        + (this.context.smoke_or_vape === 'vape' ? 'pod' : 'pack')
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
                    this.context.pod_or_pack_duration_sec = duration[0].normalized.value;
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
                    this.context.reason_for_smoking = " you wanted to.";
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
                    this.context.reason_for_quitting = " you wanted to.";
                    if (witResponse != null && witResponse.entities != null) {
                        this.userData.onboarded = true; //Set onboarded to true
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
                prompt: 'Hey it looks like you quit date has passed, how did it go?',
                type: SLOT_TYPES.OPEN_ENDED, //TODO: use wit.ai to parse out different "slots" of data to form a response
                //Ask different questions depending on whether the user succeeded or not
            }
        ],
        next: ''
    },

    quit_date_upcoming: {
        name: 'quit_date_upcoming',
        questions: [
            {
                name: 'quit_date_upcoming_emotion',
                prompt: 'Hey, it looks like your quit date is coming up soon. How are you feeling about it?',
                type: SLOT_TYPES.OPEN_ENDED, //TODO: make a empathetic response with wit.ai
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
                    this.context.quit_date_upcoming_feeling = feeling;
                    this.userData.quit_date_upcoming_feeling = feeling;
                    let res = 'You\'re going to do great!';
                    if(feeling == 'positive') {
                        res = 'Awesome! I\'m looking forward to seeing your progress! ' + res;
                    } else if(feeling == 'nervous') {
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
                name: 'has_method_to_try', //TODO: use wit.ai to parse out specific methods (or a no response) and act accordingly
                prompt: 'Now let’s talk about what method you want to use to quit. Some people like to use ' +
                'a quit aid (like gum, patches or medication) and others prefer to quit cold turkey. Have you ' +
                'thought about what method you would like to use to quit? If so, what quitting aid would you like to use?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. What aid would you like to use?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    console.log('Got response from Wit API!', JSON.stringify(witResponse));
                    const {no} = witResponse.entities;
                    if(no != null) {
                        return {
                            response: 'That\'s okay! Think about it and we\'ll come back to this another time.',
                            next: 'planning'
                        }
                    }
                    const {quitting_aids} = witResponse.entities;
                    if(quitting_aids == null) {
                        return errorResponse;
                    }
                    this.userData.quitting_aid = quitting_aids[0].value;
                    console.log('Got quitting_aid from Wit: ', this.userData.quitting_aid);
                    return {
                        response: this.userData.quitting_aid + ' is a great idea!',
                        next: 'planning'
                    }
                }
            }
        ],
        next: 'planning'
    },
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

    // If the user has already quit. Collects some data on what worked and didn't work in case they relapse.
    // TODO Coaching
    already_quit: {
        name: 'already_quit',
        questions: [
            {
                name: 'reason_for_quitting',
                prompt: 'What quitting aid or aids were helpful to you?',
                type: SLOT_TYPES.OPEN_ENDED
                //TODO: use wit.ai to match to different types of quitting methods
            }
        ],
        next: ''
    },
    __version__: '1',
};

module.exports = SECTIONS;