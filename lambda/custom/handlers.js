
module.exports = {

  SessionEndedHandler: {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
      return handlerInput.responseBuilder.getResponse();
    }
  },

  ErrorHandler: {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      const request = handlerInput.requestEnvelope.request;

      console.log(`Error handled: ${JSON.stringify(error)}`);

      return handlerInput.responseBuilder
        .speak(`Sorry, I can't understand that. Please try again.`)
        .reprompt(`Sorry, your skill got this error.  ${error.message} `)
        .getResponse();
    }
  },

  ProactiveEventHandler: {
    canHandle(handlerInput) {
      console.log(JSON.stringify(handlerInput));
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'AlexaSkillEvent.ProactiveSubscriptionChanged';
    },
    handle(handlerInput) {
      try {
        console.log("AWS User " + handlerInput.requestEnvelope.context.System.user.userId);
        console.log("API Endpoint " + handlerInput.requestEnvelope.context.System.apiEndpoint);
        console.log("Permissions" + JSON.stringify(handlerInput.requestEnvelope.request.body.subscriptions));
      }
      catch (error) {
        console.error("Error: ProactiveEventHandler Not Enabled By User " + JSON.stringify(error));
      }
    },
  }
}