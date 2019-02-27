const SLOT_TYPES = require('./slot-types');

// List of survey sections.
const SECTIONS = {
    motivation: {
        name: 'motivation',
        questions: [
            {
                name: 'cigs_per_day',
                prompt: 'How many cigarettes do you smoke per day on average?',
                type: SLOT_TYPES.NUMBER
                // TODO: onResponse() to allow better routing
                // TODO: reprompt
                // TODO: confirmation
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
        next: ''
    },
    __main__: 'motivation',
    __version__: '1',
};

module.exports = SECTIONS;