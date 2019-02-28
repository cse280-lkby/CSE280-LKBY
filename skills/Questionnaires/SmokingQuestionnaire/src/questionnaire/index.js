const SECTIONS = require('./sections');
const SLOT_TYPES = require('./slot-types');

const CONFIG = {
    name: 'Smoking Questionnaire',
    // intro should ask for consent in a yes-or-no manner.
    intro: 'Welcome to the Smoking Questionnaire. Before we start, I need'
        + ' permission to collect and save information from our conversation.'
        + ' You can view the full privacy policy on our skill information page.'
        + ' Do you consent to have your answers saved for research purposes?',
}

module.exports = {
    CONFIG,
    SECTIONS,
    SLOT_TYPES
}