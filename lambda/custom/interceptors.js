const maxHistorySize = 30; // remember only latest 20 intents 
const helper = require('./helper');

module.exports = {

    InitMemoryAttributesInterceptor: {
        process(handlerInput) {
            let sessionAttributes = {};
            if (handlerInput.requestEnvelope.session['new']) {

                sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                let memoryAttributes = helper.getMemoryAttributes();

                if (Object.keys(sessionAttributes).length === 0) {

                    Object.keys(memoryAttributes).forEach(function (key) { // initialize all attributes from global list 

                        sessionAttributes[key] = memoryAttributes[key];

                    });

                }
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            }
        }
    },

    RequestHistoryInterceptor: {
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

    },

    RequestLog: {
        process(handlerInput) {
            console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
        },
    },

    ResponseLog: {
        process(handlerInput) {
            console.log(`RESPONSE BUILDER = ${JSON.stringify(handlerInput)}`);
        },
    }
}