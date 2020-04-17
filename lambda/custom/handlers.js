const dbService = require('./dbservice');

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
        .withShouldEndSession(true)
        .getResponse();
    }
  },

  ProactiveEventHandler: {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'AlexaSkillEvent.ProactiveSubscriptionChanged';
    },
    async handle(handlerInput) {
      try {
        console.log("--------- Proactive Handler --------- ", JSON.stringify(handlerInput));
        console.log("AWS User " + handlerInput.requestEnvelope.context.System.user.userId);
        console.log("API Endpoint " + handlerInput.requestEnvelope.context.System.apiEndpoint);
        console.log("Permissions" + JSON.stringify(handlerInput.requestEnvelope.request.body.subscriptions));

        await dbService.registerForProactiveNotifications(
          handlerInput.requestEnvelope.context.System.user.userId,
          handlerInput.requestEnvelope.context.System.apiEndpoint);

        console.log("Registered user for notifications")
      }
      catch (error) {
        console.error("Error: ProactiveEventHandler Not Enabled By User " + JSON.stringify(error));
      }
    },
  },

  SkillDisabledEventHandler: {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return (request.type === 'AlexaSkillEvent.SkillDisabled');
    },
    async handle(handlerInput) {
      try {
        console.log("--------- SkillDisabled Event Handler --------- ", JSON.stringify(handlerInput));
        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        await dbService.deleteProactiveNotificationRegistration(
          handlerInput.requestEnvelope.context.System.user.userId);

        console.log(`skill was disabled for user: ${userId}`);
      } catch (error) {
        console.error("Error: SkillDisabledEventHandler" + JSON.stringify(error));
      }
    },
  }
}