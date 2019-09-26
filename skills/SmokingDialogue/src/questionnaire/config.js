const CONFIG = {
    name: 'Smoking Dialogue',
    // intro should ask for consent in a yes-or-no manner.
    intro: 'Hi, welcome to the smoking dialogue!'
    + ' Do you still consent to have your answers saved for research purposes?',
    // message after user finishes questionnaire.
    // NOTE: this is empty now because our sections respond before quitting
    completed: '',
    witToken: 'XW34OQFUC5XDLDKCUVQGYISLJO3XNOZM' // TODO, store securely
}

module.exports = CONFIG;