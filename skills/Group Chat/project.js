// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    alexaSkill: {
       nlu: 'alexa',
    },
    googleAction: {
       nlu: 'dialogflow',
    },
    stages: {
      local: {
        endpoint: '${JOVO_WEBHOOK_URL}'
      },
      dev: {
        endpoint: 'arn:aws:lambda:us-east-1:380935697061:function:SmokingQuestionnaire-Backend'
      }
    }
};
 