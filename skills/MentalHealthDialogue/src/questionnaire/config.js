const CONFIG = {
    name: 'Mental Health Dialogue',
    // intro should ask for consent in a yes-or-no manner.
    intro: 'Welcome to the Mental Health Dialogue. Before we start, I need'
        + ' permission to collect and save information from our conversation.'
        + ' You can view the full privacy policy on our skill information page.'
        + ' Do you consent to have your answers saved for research purposes?',
    // message after user finishes questionnaire
    completed: 'That\'s all I have for now. Thank you for taking the questionnaire!',
    witToken: 'SBV2SAX5336VK2GWHZJX4XO3UPWUMUD7' // TODO, store securely
}

module.exports = CONFIG;