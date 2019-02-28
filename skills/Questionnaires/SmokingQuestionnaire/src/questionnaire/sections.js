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
                    // TODO: jump to appropriate section depending on answer
                }
            },
        ],
        next: '' // TODO
    },
    __main__: 'motivation',
    __version__: '1',
};

module.exports = SECTIONS;