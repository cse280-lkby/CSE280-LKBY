// names must exactly match the _names_ of the variables on the Alexa SurveyQuestionIntent
// validate function returns a reprompt string if the input is invalid, or null otherwise
const SLOT_TYPES = {
    OPEN_ENDED: {
        name: 'openEnded'
    },
    NUMBER: {
        name: 'number',
        validate: input => isNaN(Number(input)) ? 'Please say a number.' : null
    },
    YES_NO: {
        name: 'yesOrNo',
        validate: input => (input === 'yes' || input === 'no') ? null : 'Please say yes or no.'
    }
};

module.exports = SLOT_TYPES;