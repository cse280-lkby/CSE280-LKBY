const SLOT_TYPES = require('./slot-types');

const DAYS_UNTIL_CONSIDERED_QUIT = 4;
const HALF_SEC_BREAK = breakForSec(0.5);

function dedupe(list) {
    return [...(new Set(list))];
}

function uniqueValues(witEntity) {
    if (witEntity == null) return [];
    return dedupe(witEntity.map(ent => ent.value));
}

function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function asDate(dateStr) {
    return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
}

function breakForSec(sec) {
    return ` <break time="${sec.toFixed(1)}s"/> `;
}


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
                phrase = 'Ready to talk to me about your vaping habit?';
            }
            if (smokeOrVape === 'smoke') {
                phrase = 'Ready to talk to me about your smoking habit?';
            }
            return 'Welcome back! ' + phrase;
        }
        return 'Hi there, I\'m here to help you with your smoking or vaping habit! '
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
            this.userData.quitDate = quitDate;
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

                    const {smoke_or_vape} = witResponse.entities;
                    if (smoke_or_vape == null) {
                        return errorResponse;
                    }
                    const value = smoke_or_vape[0].value;
                    if (value !== 'smoke' && value !== 'vape') {
                        console.error('Unknown value for smoke_or_vape: ' + value);
                        return errorResponse;
                    }

                    this.userData.smokeOrVape = value;
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

                    const {quit_date} = witResponse.entities;
                    if (quit_date == null) {
                        return errorResponse;
                    }
                    const dateStr = quit_date[0].value;
                    const date = new Date(dateStr);

                    if (date.getTime() > Date.now()) {
                        return errorResponse;
                    }

                    this.userData.dateLastSmoked = date;
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
                    const {duration} = witResponse.entities;
                    if (duration == null) {
                        return errorResponse;
                    }
                    // Normalized duration value is in seconds
                    this.userData.podOrPackDuration = duration[0].normalized.value;
                }
            },{
                name: 'reasons_for_smoking',
                prompt() {
                    return 'Here\'s a question you probably weren\'t expecting, what made you start '
                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking') + '?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        const {reasons_for_smoking} = witResponse.entities;
                        if (reasons_for_smoking != null) {
                            this.userData.reasonsForSmoking = uniqueValues(reasons_for_smoking);
                        }
                    }
                }
            },{
                name: 'reasons_for_quitting',
                prompt: 'I\'m wondering if a recent event inspired you to quit. What are your main reasons for quitting now?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null && witResponse.entities != null) {
                        this.userData.onboarded = true; //Set onboarded to true
                        const {reasons_for_quitting} = witResponse.entities;
                        if (reasons_for_quitting != null) {
                            this.userData.reasonsForQuitting = uniqueValues(reasons_for_quitting);
                        }
                    }
                    
                    let resp = 'You are not alone. ';
                    const {reasonsForSmoking, reasonsForQuitting} = this.userData;
                    if(reasonsForSmoking) {
                        // Build a response addressing all reasons_for_smoking
                        resp += dedupe(reasonsForSmoking.map(reason => {
                            switch (reason) {
                                case 'addiction':
                                    return 'Addiction is an extremely common issue among smokers, '
                                        + 'and is very difficult to break';
                                case 'cool':
                                    return (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                        + ' is often portrayed as really cool, which can make it hard to resist.';
                                case 'pleasure':
                                    return 'Although it may seem fun initially, '
                                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                        + ' is not worth it and will quickly cause problems in your life.';
                                case 'school':
                                    return 'School is a common social situation where peer pressure has a '
                                        + 'lot of influence.';
                                case 'depression':
                                    return (this.userData.smokeOrVape === 'vape' ? 'Vaping' : 'Smoking')
                                        + 'is often used as a way to cope with depression, '
                                        + 'but it\'s important to not become too dependent on it!';
                                case 'stress':
                                    return 'Many people in similar situations start '
                                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                        + ' to try to cope with what they are going through in life';
                                case 'friends':
                                    return 'If your friends ' + this.userData.smokeOrVape
                                        + ', it may be even harder for you to stop';
                                default:
                                    console.error('Unhandled reason for smoking! Reason is: ', reason);
                                    return '';
                            }
                        }).filter(Boolean)).join(HALF_SEC_BREAK) + HALF_SEC_BREAK;
                    }

                    if(reasonsForQuitting != null) {
                        // Build a response addressing all reasons_for_quitting
                        resp += dedupe(reasonsForQuitting.map(reason => {
                            switch (reason) {
                                case 'hate it':
                                    return 'I\'m glad that you are fed up with '
                                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                        + '!';
                                case 'expensive':
                                    return (this.userData.smokeOrVape === 'vape' ? 'Vaping' : 'Smoking')
                                        + ' is much more expensive than most people realize. Quitting can'
                                        + ' save you a lot of money'
                                case 'others':
                                    return 'It\'s great to hear that there people in your life motivating you '
                                        + 'to quit';
                                case 'sick':
                                    return 'I\'m sorry that you are feeling sick. I hope that you will feel much '
                                        + 'better after quitting!';
                                default:
                                    console.error('Unhandled reason for smoking! Reason is: ', reason);
                                    return '';
                            }
                        }).filter(Boolean)).join(HALF_SEC_BREAK) + HALF_SEC_BREAK;
                    }

                    // Based on the user's dateLastSmoked, they may be considered to have already quit
                    const alreadyQuitDate = new Date();
                    alreadyQuitDate.setDate(alreadyQuitDate.getDate() - DAYS_UNTIL_CONSIDERED_QUIT);
                    const dateLastSmoked = asDate(this.userData.dateLastSmoked);
                    if (dateLastSmoked.getTime() <= alreadyQuitDate.getTime()) {
                        this.userData.quitDate = dateLastSmoked;
                        return {
                            next: 'optional_set_quit_date'
                        };
                    }

                    // Most of the time, the user will not have quit already and need to set a quit date
                    resp += 'I think now is a good time for you to set a quit date.'
                        + HALF_SEC_BREAK;
                    return {
                        response: resp,
                        next: 'set_quit_date'
                    };
                }
            },
        ],
    },
    optional_set_quit_date: {
        name: 'optional_set_quit_date',
        questions: [
            {
                name: 'happy_with_assigned_quit_date',
                prompt() {
                    return 'Since you haven\'t ' + this.userData.smokeOrVape + 'd in a while, '
                        + 'I\'ve noted that you have already quit on '
                        + this.userData.quitDate.toLocaleString('en-US', { month: 'long', day: 'numeric' })
                        + HALF_SEC_BREAK
                        + '. I will still be here to talk whenever you need me. Does this sound good?';
                    },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I misunderstood. Should I mark down that you have already quit on '
                            + this.userData.quitDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            + '?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {yes_or_no} = witResponse.entities;
                    if (yes_or_no == null) {
                        return errorResponse;
                    }

                    if (yes_or_no[0].value === 'yes') {
                        return {
                            response: 'Awesome! Thanks so much for talking to me today. '
                                + HALF_SEC_BREAK
                                + 'Please talk to me again soon!'
                        };
                    } else {
                        return {
                            response: 'Okay, let\'s set you up with a new quit date.'
                                + HALF_SEC_BREAK,
                            next: 'set_quit_date'
                        };
                    }
                }
            }
        ]
    },
    set_quit_date: {
        name: 'set_quit_date',
        questions: [
            {
                name: 'quit_date',
                prompt() {
                    return 'When do you think you would like to be done with '
                        + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                        + '?';
                },
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

                    const {no, quit_date} = witResponse.entities;

                    // If the user doesn't know when they want to quit
                    if (no) {
                        return {
                            response: 'Setting a quit date is the first step on the journey to quitting. '
                                + HALF_SEC_BREAK
                                + 'The best quit date is one that will motivate you '
                                + 'to stop soon but still give you enough time to ease off. '
                                + + HALF_SEC_BREAK
                                + 'Take your time deciding when you want to quit by and let me know later!',
                            next: ''
                        };
                    }

                    if (quit_date == null) {
                        return errorResponse;
                    }

                    const dateStr = quit_date[0].value;
                    if (quit_date == null) {
                        return errorResponse;
                    }

                    const date = new Date(dateStr);
                    if (date.getTime() <= Date.now()) {
                        return {
                            reprompt: true,
                            response: 'I think you should give yourself some time to ease off. '
                                + HALF_SEC_BREAK
                                + 'How about a date a little further in the future?',
                        }
                    }

                    this.userData.quitDate = date;

                    return {
                        response: 'Sounds great. I\'m looking forward to helping you quit by '
                            + date.toLocaleString('en-US', { month: 'long', day: 'numeric' }) + '!'
                            + 'Let\'s talk again soon!',
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
                prompt: 'I see that your quit date has passed, how did it go?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t catch that. How did your quit attempt go?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {emotion, outcome, reasons_for_smoking} = witResponse.entities;
                    const reasonsForSmoking = uniqueValues(reasons_for_smoking);

                    let resp = '';

                    if (emotion && emotion[0].value === 'positive') {
                        resp += randomChoice([
                            'That\'s the right attitude to have!',
                            'I\'m glad you\'re feeling optimistic!',
                            'Having a positive viewpoint on your situation helps a lot!'
                        ]) + HALF_SEC_BREAK;
                    }
                    else if ((emotion && emotion[0].value === 'negative')
                        || (emotion && emotion[0].value === 'nervous')) {
                        if (!reasonsForSmoking.includes('depression')) {
                            reasonsForSmoking.push('depression');
                        }
                    }

                    if (reasons_for_smoking != null) {
                        resp += dedupe(reasonsForSmoking.map(reason => {
                            switch (reason) {
                                case 'addiction':
                                    return randomChoice([
                                        'Whenever cravings hit, take deep breaths, count to five, exhale, and say, '
                                            + '"N-O-P-E, Not One Puff Ever".',
                                        'Tell yourself "this too shall pass" when your next craving happens.'
                                    ]);
                                case 'depression':
                                    return randomChoice([
                                        'Sorry to hear that you are feeling down.',
                                        'Sorry to hear that you are having such a hard time.',
                                        'We are all insecure at some point. Life has it\'s ups and downs.',
                                        'The path to happiness is not always quick or easy. Sometimes, you have to '
                                            + 'slowly work towards it.'
                                    ]);
                                case 'friends':
                                    return randomChoice([
                                        'See if you can avoid those friends who ' + this.userData.smokeOrVape + '.',
                                        'Tell yourself "Not one puff ever. I will not accept any invitations '
                                            + 'to ' + this.userData.smokeOrVape + ' with my friends."',
                                        'If you\'re friends ' + this.userData.smokeOrVape + ', that doesn\'t mean '
                                            + 'you have to. You can always say no to ' + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                            + '.'
                                    ]);
                                case 'stress':
                                    return randomChoice([
                                        'Stressful situations may cause cravings, but you can overcome them.',
                                        'Try to find other ways with dealing with your stress. Working out, '
                                            + 'taking a walk, or hanging out with friends are some great examples.',
                                        'Sometimes you have to accept that you won\'t get everything on your To-Do list done. '
                                            + 'Managing your time to prioritize your most important tasks first can help with stress.'
                                    ]);
                                case 'school':
                                    return randomChoice([
                                        'Stressful situations may cause cravings, but you can overcome them.',
                                        'School can be a difficult place to avoid cravings. However, keeping true '
                                            + 'to your commitment of not ' + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking')
                                            + ' is very important.'
                                    ]);
                                case 'pleasure':
                                    return randomChoice([
                                        'While ' + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking') + ' can feel nice in the '
                                            + 'moment, it is important to remember all the negative consequences.',
                                        'Remember, a moment of pleasure is not worth a lifetime of health problems.',
                                        'Remember, a few moments of pleasure is not worth the hundreds of dollars you will '
                                            + 'end up sinking into your habit.'
                                    ]);
                                default:
                                    console.error('Unhandled reason for smoking! Reason is: ', reason);
                                    return '';
                            }
                        }).filter(Boolean)).join(HALF_SEC_BREAK) + HALF_SEC_BREAK;
                    }

                    resp += randomChoice([
                        'You know this is not easy but you are doing it to enjoy better health.',
                        'To help you get through this, you can start journaling about the bad things '
                            + 'that you don\'t miss. For example: I don\'t miss the way I have '
                            + 'difficulty breathing. I don\'t miss burning money.',
                        'What you are feeling is normal. It may feel like you\'ve lost your best friend '
                            + 'at first but stay positive and soon this feeling will pass. '
                            + 'I\'m always here to help you if you want to talk.',
                        'Take it one day, one hour, or one minute at a time. Never give up.',
                        'Create a reward system for yourself for each day you stay smoke-free, like a savings '
                            + 'jar. Put a paper inside that says, "I saved x dollars by not smoking today."',
                        'Drink plenty of water. Stay busy. Try meditation or yoga or crossword puzzles. You '
                            + 'can do this!'
                    ]) + HALF_SEC_BREAK;

                    if (outcome == null || outcome[0].confidence < .85) {
                        // Response was not understood properly. Redirect
                        // to a simple yes or no question 
                        console.error('Did not understand quit_date_passed response');
                        return {
                            response: resp,
                            next: 'quit_date_passed_unclear_response'
                        };
                    }

                    if (outcome[0].value === 'positive') {
                        // 'positive' outcome indicates that the user successfully quit.
                        const prefix = randomChoice([
                            'Congratulations!',
                            'Congrats on quitting!',
                            'Yay! I\'m so glad you are doing well.',
                            'Great job.',
                            'Congratulations. I\'m happy for you.'
                        ]);
                        resp += 'Remember that I\'m always here to talk if needed. I look forward to checking in '
                            + 'on your progress again soon!';

                        return {
                            response: prefix + " " + resp,
                            next: '',
                        };
                    }
                    else {
                        // 'negative' outcome indicates a relapse
                        const prefix = randomChoice([
                            'Don\'t worry. Many have to quit several times before they succeed.',
                            'Don\'t feel bad. Smoking is an addiction so be brave to tackle it.',
                            'Don\'t be discouraged. Things happen and as long as you continue to '
                                + 'try, you will succeed.',
                            'I\'m proud of your effort. As long as you don\'t stop trying it\'s all good.'
                        ]);
                        resp += "Lets get you set up with a new quit date." + HALF_SEC_BREAK;
                        return {
                            response: prefix + " " + resp,
                            next: 'set_quit_date',
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
                prompt: 'Do you want to set a new quit date?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t catch that. Do you want to set a new quit date?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {yes_or_no} = witResponse.entities;
                    if (yes_or_no == null) {
                        return errorResponse;
                    }

                    if (yes_or_no[0].value === 'yes') {
                        return {
                            next: 'set_quit_date',
                        }
                    } else {
                        return {
                            response: 'Okay. Good luck on your journey. I will always be here for you if you need '
                                + 'to talk.',
                        }
                    }
                }
            }
        ]
    },

    // quit_attempt_failed: {
    //     name: 'quit_attempt_failed',
    //     questions: [
    //         {
    //             name: 'quit_attempt_thoughts',
    //             prompt: 'What was going through your head as you attempted to quit?',
    //             type: SLOT_TYPES.OPEN_ENDED,
    //             useWit: true,
    //             onResponse(input, witResponse) {
    //                 // TODO coach based on recognized responses
    //                 return {
    //                     response: 'I completely understand. That is a very common experience '
    //                         + 'but I know you can do this. I think we should get you back on '
    //                         + 'the wagon.',
    //                     next: 'set_quit_date'
    //                 };
    //             }
    //         }
    //     ]
    // },

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
                        response: 'Sorry, I didn\'t understand that. What quitting aid worked best for you?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {quitting_aids} = witResponse.entities;
                    if (quitting_aids == null) {
                        return errorResponse;
                    }
                    // Store quitting aids as an array of values
                    this.userData.successfulQuittingAids = uniqueValues(quitting_aids);
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
                        response: 'Sorry, I didn\'t catch that. How are you feeling about your upcoming quit date?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {emotion} = witResponse.entities;
                    if (emotion == null) {
                        return errorResponse;
                    }

                    // Parse out the type of emotion said and build the response string accordingly.
                    const feelings = uniqueValues(emotion);
                    this.userData.quitDateUpcomingFeelings = feelings;

                    const prefixes = [];
                    if (feelings.includes('negative') || feelings.includes('nervous')) {
                        prefixes.push(randomChoice([
                            'Be brave.',
                            'No need to feel nervous.',
                            'Don\'t dread quitting.'
                        ]));
                    }
                    if (feelings.includes('positive')) {
                        prefixes.push(randomChoice([
                            'It\'s great to hear that you are thinking positively!',
                            'I\'m so glad to hear that you are optimistic!'
                        ]));
                    }
                    const prefix = prefixes.join(HALF_SEC_BREAK);

                    const suffix = randomChoice([
                        'I will be here for you all the time. You can also call '
                            + '1 800 Quit Now to talk to human coaches if you are struggling.',
                        'If you need to talk to a human counselor, call 1 800 Quit Now. '
                            + 'Start to reduce the amount of times you '
                            + this.userData.smokeOrVape
                            + ' today. Good luck!',
                        'It is never too late to try to quit. I am always here for you. You '
                            + 'can also call 1 800 Quit Now to speak to a human counselor.',
                        'Quitting is difficult but you can do it. Take it one day at a time. '
                            + 'challenge yourself to cut down on the amount you '
                            + this.userData.smokeOrVape + ' before you quit.',
                        'Remember, whenever cravings hit, take deep breaths. Stay busy and drink '
                            + 'plenty of water.',
                        'One strategy that might help is to think about or write down all the bad things '
                            + 'that you don\'t miss: for example, I don\'t miss the way it makes me smell. '
                            + 'I don\'t miss the difficulty I have breathing after ' 
                            + (this.userData.smokeOrVape === 'vape' ? 'vaping' : 'smoking') + '.',
                        'Quitting is difficult but you can do it. Take it one day at a time. Challenge yourself '
                            + 'to cut down on the amount in regular intervals leading up to your quit date.'
                    ]);

                    let response = [prefix, suffix].filter(Boolean).join(HALF_SEC_BREAK)
                        + HALF_SEC_BREAK;
                    let next = null;

                    // If the user hasn't set quitting aids, ask about those
                    if (!this.userData.quittingAids) {
                        next = 'quitting_aids';
                    }
                    // TODO: add more sections like so:
                    //  else if (!this.userData.example) {
                    //      next = 'example';
                    //  }
                    // End the session
                    else {
                        next = 'planning';
                    }

                    return {
                        response,
                        next
                    };
                }
            },
        ],
    },
    quitting_aids: {
        name: 'quitting_aids',
        questions: [
            {
                name: 'interested_in_quitting_aids',
                prompt: 'Would you be interested in talking about quitting aids?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. Are you interested in talking about quitting aids?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }

                    const {yes_or_no} = witResponse.entities;
                    if (yes_or_no == null) {
                        return {
                            response: 'That\'s okay! Think about it and we\'ll come back to this another time.',
                        }
                    }

                    if (yes_or_no[0].value === 'no') {
                        return {
                            next: 'planning'
                        };
                    }
                }
            },
            {
                name: 'has_method_to_try', //use wit.ai to parse out specific methods (or a no response) and act accordingly
                prompt: 'Popular quitting aids include nicotine gum, patches and medication. '
                    + 'Another popular approach is to quit "cold turkey". '
                    + HALF_SEC_BREAK
                    + 'Have you thought about what method you would like to use to quit? '
                    + 'If so, what method will you try?',
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
                    this.userData.quittingAids = uniqueValues(quitting_aids);

                    return {
                        response: 'That\'s a great idea!' + HALF_SEC_BREAK,
                        next: 'planning'
                    }
                }
            }
        ],
        next: 'planning'
    },
    // TODO: more coaching!
    planning: {
        name: 'planning',
        questions: [
            {
                name: 'top_triggers',
                // TODO: Can this be customized to list *what the client likes about smoking*
                prompt: 'Let\'s do some plannning for the situations where you usually smoke. What are your top triggers?',
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input, witResponse) {
                    const errorResponse = {
                        reprompt: true,
                        response: 'Sorry, I didn\'t understand that. What are your top triggers?',
                    };
                    if (witResponse == null || witResponse.entities == null) {
                        return errorResponse;
                    }
                    const {reasons_for_smoking} = witResponse.entities;
                    if (reasons_for_smoking == null) {
                        return errorResponse;
                    }
                    this.userData.topTriggers = uniqueValues(reasons_for_smoking);

                    let response = randomChoice([
                        'Thank you for taking the time to talk to me today. Let\'s talk again soon.',
                        'It was great to talk to you today. Let\'s talk again soon.',
                        'That\'s all I have for now. Please talk to me again soon.'
                    ]);

                    return {
                        response,
                        next: ''
                    }
                }
            },
        ],
        next: ''
    },
    // // Goodbye section to say farewell to the user
    // quit_date_upcoming_goodbye: {
    //     name: 'quit_date_upcoming_goodbye',
    //     questions: [
    //         {
    //             name:
    //         },
    //     ],
    // },

    __version__: '1',
};

module.exports = SECTIONS;