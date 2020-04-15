module.exports = {
    AMAZON_CancelIntent_Handler: {

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
    },

    AMAZON_HelpIntent_Handler: {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
        },
        handle(handlerInput) {
            const speechText = 'You can say hello to me!';

            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .withSimpleCard('Hello World', speechText)
                .getResponse();
        },
    },

    AMAZON_StopIntent_Handler: {
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
    },

    AMAZON_NavigateHomeIntent_Handler: {
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
    }
}