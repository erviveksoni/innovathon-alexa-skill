// Lambda Function code for Alexa.

const helper = require('./helper');
const interceptors = require('./interceptors');
const handlers = require('./handlers')
const systemIntents = require('./systemIntents');
const customIntents = require('./customIntents');
const constants = require('./constants');

const Alexa = require("ask-sdk-core");

// Internal Intent Handlers =============================================

const LaunchRequest_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {

    const { serviceClientFactory, responseBuilder } = handlerInput;
    try {
      const upsServiceClient = serviceClientFactory.getUpsServiceClient();
      const profileName = await upsServiceClient.getProfileName();

      let say = 'Hello ' + profileName + ' and welcome to ' + constants.APP_NAME + ' ! How can I help You today ?.';
      return responseBuilder
        .speak(say)
        .reprompt(say)
        .withStandardCard(
          constants.APP_NAME,
          `Welcome to ${constants.APP_NAME}!\nHow can I help you today ?`,
          helper.welcomeCardImg.smallImageUrl, helper.welcomeCardImg.largeImageUrl)
        .getResponse();

    } catch (error) {
      console.log(JSON.stringify(error));
      if (error.statusCode == 403) {
        return responseBuilder
          .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
          .withAskForPermissionsConsentCard([constants.FULL_NAME_PERMISSION])
          .getResponse();
      }

      console.log(JSON.stringify(error));
      const response = responseBuilder.speak(constants.messages.ERROR).getResponse();
      return response;
    }
  },
};

// Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    systemIntents.AMAZON_CancelIntent_Handler,
    systemIntents.AMAZON_HelpIntent_Handler,
    systemIntents.AMAZON_StopIntent_Handler,
    systemIntents.AMAZON_NavigateHomeIntent_Handler,
    customIntents.OrdersIntentHandler,
    customIntents.OrderStatusIntentHandler,
    customIntents.AskForOrderStatusIntentHandler,
    customIntents.OrderActionsIntentHandler,
    customIntents.CancelOrderIntentHandler,
    customIntents.RescheduleOrderIntentHandler,
    LaunchRequest_Handler,
    handlers.SessionEndedHandler
  )
  .addRequestInterceptors(interceptors.RequestLog)
  .addResponseInterceptors(interceptors.ResponseLog)
  .addErrorHandlers(handlers.ErrorHandler)
  .addRequestInterceptors(interceptors.InitMemoryAttributesInterceptor)
  .addRequestInterceptors(interceptors.RequestHistoryInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();


// End of Skill code -------------------------------------------------------------