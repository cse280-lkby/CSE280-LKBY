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

    background: {
        name: 'feelings',
        questions: [
            {
                name: 'feeling',
                prompt: 'How are you feeling today? ',
                type: SLOT_TYPES.OPEN_ENDED,
            },
            {
                name: 'issues',
                prompt: 'What is your main issue today? ',
                type: SLOT_TYPES.OPEN_ENDED,
            },
            
            {
                name: 'help',
                prompt: 'How can I help you? ',
                type: SLOT_TYPES.OPEN_ENDED,
            },
            {
                name: 'past_problem',
                prompt: 'Did you have this problem in the past? Please answer yes or no. ',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input == 'no') return 'seekhelp';
                }
            },
        ],
        next: 'frequency',
    },

    frequency: {
        name: 'frequency',
        questions: [
            {
                name: 'frequency',
                prompt: 'How frequent did you experience this problem in the past?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'seekhelp',
    },
    seekhelp: {
        name: 'seekhelp',
        questions: [
            {
                name: 'previous_help',
                prompt: 'Have you sought help from friends, families, or counselors? Please answer yes or no.',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'causes';
                }
            },{
                name: 'help_frequency',
                prompt: 'How frequent did you seek help?',
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'causes'
    },

    causes: {
        name: 'causes',
        questions: [
            {
                name: 'what_causes',
                prompt: 'Do you know what causes this problem? Please answer yes or no. ',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input == 'yes') return 'coping';
                }
            }, {
                name: 'appointment',
                prompt: 'Would you be interested in speaking with a human in person? Please answer yes or no',
                type: SLOT_TYPES.YES_NO,
            }
        ],
    },


    coping: {
        name: 'coping',
        questions: [
            {
                name: 'coping_strategy',
                prompt: 'Do you have a coping strategy? Please answer yes or no.',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'yes') return 'what_strategy';
                }
            },{
                name: 'want_help',
                prompt: 'Are you interested in finding a coping strategy that would help you? Please answer yes or no. ',
                type: SLOT_TYPES.YES_NO
            },
        ],
    },

    what_strategy: {
        name: 'what_strategy',
        questions: [
            {
                name: 'what_strategy',
                prompt: 'What is your current method for coping?',
                type: SLOT_TYPES.OPEN_ENDED
            }, 
        ],
    },

    __main__: 'background',
    __version__: '1',
};

module.exports = SECTIONS;