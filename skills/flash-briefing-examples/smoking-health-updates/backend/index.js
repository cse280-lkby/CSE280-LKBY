const reasonsToQuit = [
    "Because we died young.",
    "Because smokers have a much higher chance of getting lung cancer.",
    "Because you will stop inhaling 69 cancer causing chemicals.",
    "Because you'll reduce your odds of lung cancer by 52%.",
    "Because you'll be able to fall asleep faster.",
];

function randomReason() {
    return reasonsToQuit[Math.floor(Math.random() * reasonsToQuit.length)];
}

function getMainText() {
    return "Why quit smoking? " + randomReason()
        + " Please call 1-800-no-butts when you are ready to quit.";
}

exports.handler = async (event) => {
    const feedItem = {
      uid: Date.now(),
      updateDate: new Date().toISOString(),
      titleText: "Why quit smoking? " + new Date().toDateString() + " Update",
      mainText: getMainText(),
      redirectionUrl: "https://whyquit.com/#why"
    };
    
    const response = {
        statusCode: 200,
        body: JSON.stringify(feedItem),
    };
    return response;
};
