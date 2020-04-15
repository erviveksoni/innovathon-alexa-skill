
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
        .speak(`Sorry, your skill got this error.  ${error.message} `)
        .reprompt(`Sorry, your skill got this error.  ${error.message} `)
        .getResponse();
    }
  }
}