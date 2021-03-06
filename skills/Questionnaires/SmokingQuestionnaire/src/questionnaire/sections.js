const SLOT_TYPES = require('./slot-types');

/*
 * Sections:
 *  must contain a 'name', a list of 'questions' (at least 1), and can have a 'next'.
 *  Note: 'name' field must match the name of the key in the SECTIONS object.
 * 
 * Questions:
 *  must contain a 'name', 'prompt', 'type' (SLOT_TYPES.XXXX).
 *  Optional: 'reprompt', 'onResponse' (more below)
 *  Note: the first question has ID 0, second has ID 1, etc.
 * 
 * onResponse(value):
 *  Called when a question is answered.
 *  Possible returns:
 *   - A string to jump to a different section
 *   - Nothing to continue normal conversation flow.
 */

// List of survey sections.
const SECTIONS = {
    motivation: {
        name: 'motivation',
        questions: [
            {
                name: 'have_smoked_recently',
                prompt: 'Have you smoked in the last 24 hours?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input === 'no') return 'already_quit';
                }
            },{
                name: 'cigs_per_day',
                prompt: 'How many cigarettes do you smoke per day on average?',
                type: SLOT_TYPES.NUMBER
            },{
                name: 'reason_for_smoking',
                prompt: 'Here\'s a question you probably weren\'t expecting, what do you like about smoking?',
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'reason_for_quitting',
                prompt: 'I\'m wondering if a recent event inspired you to quit. What are your main reasons for quitting now?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'healthIssues'
    },
    // If the user has already quit. Collects some data on what worked and didn't work in case they relapse.
    already_quit: {
        name: 'already_quit',
        questions: [
            {
                name: 'date_stop_smoking',
                prompt: "Congratulations on quitting! When did you stop smoking?",
                type: SLOT_TYPES.OPEN_ENDED, // TODO: Change to date
            },{
                name: 'reason_for_quitting',
                prompt: 'What methods were successful for you?',
                type: SLOT_TYPES.OPEN_ENDED
            }/*,{
                name: 'end', // TODO: Is there a better way to do this?
                prompt: 'Free to talk to me again if you are struggling or relapse! I\'ll be here waiting to help you!',
                type: SLOT_TYPES.OPEN_ENDED
            }*/
        ],
        next: '' // TODO: End conversation!
    },
    healthIssues: {
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
    },
    quitting_aids: { // TODO: How to implement allowing users to ask for more info on different methods?
        name: 'quitting_aids',
        questions: [
            {
                name: 'has_method_to_try',
                prompt: 'Now let’s talk about what method you want to use to quit. Some people like to use a quit aid (like gum, patches or medication) and others prefer to quit cold turkey. Have you thought about what method you would like to use to quit? Please answer yes or no.',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input === 'yes') return 'quitting_aids_helper';
                }
            } // NOT DONE
        ],
        next: 'planning'
    },
    // Helper for when user responds that they know which method they want to use
    quitting_aids_helper: { //TODO: reformat back into quitting_aids (possible?)
        name: 'quitting_aids_helper',
        questions: [
            {
                name: 'quitting_aid',
                prompt: 'What quitting aid would you like to use?',
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: 'planning'
    },
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
        next: '' // TODO
    },
    __main__: 'motivation',
    __version__: '1',
};

module.exports = SECTIONS;