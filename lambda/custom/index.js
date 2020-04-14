// Lambda Function code for Alexa.

var helpers = require('./helper');
const Alexa = require("ask-sdk-core");

// Constants ===========================================================================

const APP_NAME = "Otto Store";
const maxHistorySize = 30; // remember only latest 20 intents 
const FULL_NAME_PERMISSION = "alexa::profile:name:read";
const EMAIL_PERMISSION = "alexa::profile:email:read";
const MOBILE_PERMISSION = "alexa::profile:mobile_number:read";
const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app.',
  ERROR: 'Uh Oh. Looks like something went wrong.'
};

const APP_ID = undefined; // TODO replace with your Skill ID (OPTIONAL).

// Internal Intent Handlers =============================================

const AMAZON_CancelIntent_Handler = {

  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


    let say = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AMAZON_HelpIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let history = sessionAttributes['history'];
    let intents = getCustomIntents();
    let sampleIntent = randomElement(intents);

    let say = 'You asked for help. ';

    let previousIntent = getPreviousIntent(sessionAttributes);
    if (previousIntent && !handlerInput.requestEnvelope.session.new) {
      say += 'Your last intent was ' + previousIntent + '. ';
    }

    say += ' Here something you can ask me, ' + getSampleUtterance(sampleIntent);

    return responseBuilder
      .speak(say)
      .reprompt('try again, ' + say)
      .getResponse();
  },
};

const AMAZON_StopIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AMAZON_NavigateHomeIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = 'Hello from AMAZON.NavigateHomeIntent. ';


    return responseBuilder
      .speak(say)
      .reprompt('try again, ' + say)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
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
};

const InitMemoryAttributesInterceptor = {
  process(handlerInput) {
    let sessionAttributes = {};
    if (handlerInput.requestEnvelope.session['new']) {

      sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      let memoryAttributes = helpers.getMemoryAttributes();

      if (Object.keys(sessionAttributes).length === 0) {

        Object.keys(memoryAttributes).forEach(function (key) { // initialize all attributes from global list 

          sessionAttributes[key] = memoryAttributes[key];

        });

      }
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
};

const RequestHistoryInterceptor = {
  process(handlerInput) {

    const thisRequest = handlerInput.requestEnvelope.request;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let history = sessionAttributes['history'] || [];

    let IntentRequest = {};
    if (thisRequest.type === 'IntentRequest') {

      let slots = [];

      IntentRequest = {
        'IntentRequest': thisRequest.intent.name
      };

      if (thisRequest.intent.slots) {

        for (let slot in thisRequest.intent.slots) {
          let slotObj = {};
          slotObj[slot] = thisRequest.intent.slots[slot].value;
          slots.push(slotObj);
        }

        IntentRequest = {
          'IntentRequest': thisRequest.intent.name,
          'slots': slots
        };

      }

    } else {
      IntentRequest = {
        'IntentRequest': thisRequest.type
      };
    }
    if (history.length > maxHistorySize - 1) {
      history.shift();
    }
    history.push(IntentRequest);

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  }

};

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

      let say = 'Hello ' + profileName + ' and welcome to ' + APP_NAME + ' ! How can I help You today ?.';
      return responseBuilder
        .speak(say)
        .reprompt(say)
        .withStandardCard(
          APP_NAME,
          `Welcome to ${APP_NAME}!\nHow can I help you today ?`,
          helpers.welcomeCardImg.smallImageUrl, helpers.welcomeCardImg.largeImageUrl)
        .getResponse();

    } catch (error) {
      console.log(JSON.stringify(error));
      if (error.statusCode == 403) {
        return responseBuilder
          .speak(messages.NOTIFY_MISSING_PERMISSIONS)
          .withAskForPermissionsConsentCard([FULL_NAME_PERMISSION])
          .getResponse();
      }

      console.log(JSON.stringify(error));
      const response = responseBuilder.speak(messages.ERROR).getResponse();
      return response;
    }
  },
};

// Custom Intent Implementation ===================================================

const OrdersIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'OrdersIntent';
  },
  async handle(handlerInput) {
    const { serviceClientFactory, responseBuilder, requestEnvelope } = handlerInput;

    const upsServiceClient = serviceClientFactory.getUpsServiceClient();
    const profileEmail = await upsServiceClient.getProfileEmail();

    if (!profileEmail) {
      const noEmailResponse = `It looks like you don\'t have an email set. You can set your email from the companion app.`
      return responseBuilder
        .speak(noEmailResponse)
        .withSimpleCard(APP_NAME, noEmailResponse)
        .getResponse();
    }

    const request = requestEnvelope.request;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }

    let say = 'Okay !';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);
    let status = '';
    if (slotValues.statusSlot.ERstatus === 'ER_SUCCESS_MATCH') {
      status = slotValues.statusSlot.resolved;
      sessionAttributes['Status'] = status;

    } else if ((slotValues.statusSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.statusSlot.heardAs)) {

      return responseBuilder
        .speak("Which orders would you like to see open or closed ?")
        .reprompt("Do you want to see open orders or closed ?")
        .getResponse();
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    say = `Here are your ${status} orders`;
    let orderList = `Apple IPhone\nBose Headphones`;

    return responseBuilder
      .addDelegateDirective({
        name: 'AskForOrderStatusIntent',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .speak(say)
      .withStandardCard(
        APP_NAME,
        orderList,
        helpers.welcomeCardImg.smallImageUrl, helpers.welcomeCardImg.largeImageUrl)
      .reprompt("Would you like to know the status of any order?")
      .getResponse();
  }
};

const AskForOrderStatusIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AskForOrderStatusIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();

    }
    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);

    //   SLOT: confirmSlot 
    if (slotValues.confirmSlot.ERstatus === 'ER_SUCCESS_MATCH') {

      let confirm = slotValues.confirmSlot.resolved;
      sessionAttributes['Confirm'] = confirm;

      if (confirm === "no") {
        say = `Okay, have a nice day!`;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return responseBuilder
          .speak(say)
          .withShouldEndSession(true)
          .getResponse();
      } else {
        say = `Sure..`;
      }

      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      return responseBuilder
        .speak(say) // delegate to Alexa to collect all the required slots for next Intent
        .addDelegateDirective({
          name: 'OrderStatusIntent',
          confirmationStatus: 'NONE',
          slots: {}
        })
        .reprompt("Which order?")
        .getResponse();
    } else if ((slotValues.confirmSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.confirmSlot.heardAs)) {
      return responseBuilder
        .speak("Would you like to know the status for any open order?")
        .reprompt("Do you want to check the status for any open order?")
        .getResponse();
    }
  },
};

const OrderStatusIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'OrderStatusIntent';
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }

    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);
    // helpers.getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

    //   SLOT: snackSlot 
    if (slotValues.nameSlot.heardAs) {

      let name = slotValues.nameSlot.heardAs;
      if (name === "nothing") {
        say = `Okay, have a nice day!`;
        return responseBuilder
          .speak(say)
          .withShouldEndSession(true)
          .getResponse();
      }
      else {
        say = `Your order for ${name} is getting dispatched`;
      }

      sessionAttributes['OrderName'] = name;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return responseBuilder
        .speak(say)
        .addDelegateDirective({
          name: 'OrderActionsIntent',
          confirmationStatus: 'NONE',
          slots: {}
        })
        .reprompt("Would you like to reschedule or cancel this order?")
        .getResponse();
    } else if (!slotValues.nameSlot.heardAs) {
      return responseBuilder
        .speak("Can you tell me the name of the order?")
        .reprompt("What's the name of the order?")
        .getResponse();
    }
  }
};

const OrderActionsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'OrderActionsIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();

    }
    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);

    //   SLOT: confirmSlot 
    if (slotValues.actionsSlot.ERstatus === 'ER_SUCCESS_MATCH') {

      let actions = slotValues.actionsSlot.resolved;
      sessionAttributes['OrderAction'] = actions;

      if (actions === "nothing" || actions === "do nothing") {
        say = `Okay!`;

        sessionAttributes['OrderName'] = '';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return responseBuilder
          .speak(say)
          .addDelegateDirective({
            name: 'AskForOrderStatusIntent',
            confirmationStatus: 'NONE',
            slots: {}
          })
          .reprompt("Would you like to know the status of any other order?")
          .getResponse();

      } else if (actions === "cancel") {

        say = `Okay!`
        return responseBuilder
          .speak(say)
          .addDelegateDirective({
            name: 'CancelOrderIntent',
            confirmationStatus: 'NONE',
            slots: {
              orderNameSlot: {
                name: 'orderNameSlot',
                value: sessionAttributes['OrderName'],
                confirmationStatus: 'NONE'
              }
            }
          })
          .reprompt("Cancel this order?")
          .getResponse();

      } else if (actions === "reschedule") {

        say = `Sure, rescheduling your order for ${sessionAttributes['OrderName']}`;
        return responseBuilder
          .speak(say)
          .addDelegateDirective({
            name: 'RescheduleOrderIntent',
            confirmationStatus: 'NONE',
            slots: {
              nameSlot: {
                name: 'nameSlot',
                value: sessionAttributes['OrderName'],
                confirmationStatus: 'NONE'
              }
            }
          })
          .reprompt("Reschedule this order?")
          .getResponse();
      }
    } else if ((slotValues.actionsSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.actionsSlot.heardAs)) {
      return responseBuilder
        .speak("Would you reschedule this order?")
        .reprompt("Do you want to you reschedule this order?")
        .getResponse();
    }
  },
};

const RescheduleOrderIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'RescheduleOrderIntent';
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }
    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);
    // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

    console.log("SLOT VALUES: " + JSON.stringify(slotValues))

    //   SLOT: nameSlot 
    let name = '';
    if (slotValues.nameSlot.heardAs) {
      name = slotValues.nameSlot.heardAs;
      if (name === "nothing") {
        say = `Okay, have a nice day!`;
        return responseBuilder
          .speak(say)
          .withShouldEndSession(true)
          .getResponse();
      }
    } else if (!slotValues.nameSlot.heardAs) {
      return responseBuilder
        .speak("Can you tell me the name of the order?")
        .reprompt("What's the name of the order?")
        .getResponse();
    }

    let day = ''
    if (slotValues.daySlot.heardAs) {
      day = slotValues.daySlot.heardAs;
      sessionAttributes['Day'] = day;

    } else if (!slotValues.daySlot.heardAs) {
      return responseBuilder
        .speak("When ?")
        .reprompt("Which day do you want to reschedule to ?")
        .getResponse();
    }

    let deliveryTime = ''
    if (slotValues.timeSlot.heardAs) {
      deliveryTime = slotValues.timeSlot.heardAs;
      sessionAttributes['Time'] = deliveryTime;

    } else if (!slotValues.timeSlot.heardAs) {
      return responseBuilder
        .speak("What time ?")
        .reprompt("At what time ?")
        .getResponse();
    }

    let beforeAfter = ''
    if (slotValues.beforeAfterSlot.ERstatus === 'ER_SUCCESS_MATCH') {
      beforeAfter = slotValues.beforeAfterSlot.resolved;
      sessionAttributes['BeforeAfter'] = beforeAfter;

    } else if ((slotValues.beforeAfterSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.beforeAfterSlot.heardAs)) {

      return responseBuilder
        .speak("Before of after ?")
        .reprompt("Before or after this time ?")
        .getResponse();
    }

    say = `We have rescheduled your order for ${name} on ${day} ${beforeAfter} ${deliveryTime} `;
    console.log(say);

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return responseBuilder
      .speak(say) // delegate to Alexa to collect all the required slots for next Intent
      .addDelegateDirective({
        name: 'AskForOrderStatusIntent',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .reprompt("Would you like to know the status of any order?")
      .getResponse();
  }
};

const CancelOrderIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'CancelOrderIntent';
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }
    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = helpers.getSlotValues(request.intent.slots);
    // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

    //   SLOT: nameSlot 
    let name = '';
    if (slotValues.orderNameSlot.heardAs) {
      name = slotValues.orderNameSlot.heardAs;
      if (name === "nothing") {
        say = `Okay, have a nice day!`;
        return responseBuilder
          .speak(say)
          .withShouldEndSession(true)
          .getResponse();
      }
    } else if (!slotValues.orderNameSlot.heardAs) {
      return responseBuilder
        .speak("Can you tell me the name of the order?")
        .reprompt("What's the name of the order?")
        .getResponse();
    }

    say = `Cancelled your order for ${name} `;
    sessionAttributes['OrderName'] = '';
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return responseBuilder
      .speak(say) // delegate to Alexa to collect all the required slots for next Intent
      .addDelegateDirective({
        name: 'AskForOrderStatusIntent',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .reprompt("Would you like to know the status of any other order?")
      .getResponse();
  }
};

// Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    AMAZON_CancelIntent_Handler,
    AMAZON_HelpIntent_Handler,
    AMAZON_StopIntent_Handler,
    AMAZON_NavigateHomeIntent_Handler,
    OrdersIntentHandler,
    OrderStatusIntentHandler,
    AskForOrderStatusIntentHandler,
    OrderActionsIntentHandler,
    CancelOrderIntentHandler,
    RescheduleOrderIntentHandler,
    LaunchRequest_Handler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(InitMemoryAttributesInterceptor)
  .addRequestInterceptors(RequestHistoryInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();


// End of Skill code -------------------------------------------------------------