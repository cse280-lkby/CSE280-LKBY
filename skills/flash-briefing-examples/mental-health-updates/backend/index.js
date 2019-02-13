const reasonsToLive = [
    "Because smokers die young.",
    "Because smokers have a much higher chance of getting lung cancer.",
    "Because you will stop inhaling 69 cancer causing chemicals.",
    "Because you'll reduce your odds of lung cancer by 52%.",
    "Because you'll be able to fall asleep faster.",
];

function randomReason() {
    return reasonsToLive[Math.floor(Math.random() * reasonsToLive.length)];
}

function getMainText() {
    return randomReason()
        + " Please schedule a meeting with a counselor or use our College Buddy skill to seek more help.";
}

exports.handler = async (event) => {
    const feedItem = {
      uid: Date.now(),
      updateDate: new Date().toISOString(),
      titleText: new Date().toDateString() + " Update",
      mainText: getMainText(),
      redirectionUrl: "https://www.mentalhelp.net/"
    };
    
    const response = {
        statusCode: 200,
        body: JSON.stringify(feedItem),
    };
    return response;
};