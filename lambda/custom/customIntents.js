const constants = require('./constants');
const helper = require('./helper');

module.exports = {
    // Custom Intent Implementation ===================================================

    OrdersIntentHandler: {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            return request.type === 'IntentRequest' && request.intent.name === 'OrdersIntent';
        },
        async handle(handlerInput) {
            const { serviceClientFactory, responseBuilder, requestEnvelope } = handlerInput;

            try {
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const profileEmail = await upsServiceClient.getProfileEmail();

                if (!profileEmail) {
                    const noEmailResponse = `It looks like you don\'t have an email set. You can set your email from the companion app.`
                    return responseBuilder
                        .speak(noEmailResponse)
                        .withSimpleCard(constants.APP_NAME, noEmailResponse)
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

                let slotValues = helper.getSlotValues(request.intent.slots);
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
                let orderList = ["Apple IPhone", "Bose Headphones"];
                say = `Here are your ${status} orders: ${orderList.join(",")}`;

                return responseBuilder
                    .addDelegateDirective({
                        name: 'AskForOrderStatusIntent',
                        confirmationStatus: 'NONE',
                        slots: {}
                    })
                    .speak(say)
                    .withStandardCard(
                        constants.APP_NAME,
                        orderList.join('\n'),
                        helper.welcomeCardImg.smallImageUrl, helper.welcomeCardImg.largeImageUrl)
                    .reprompt("Would you like to know the status of any order?")
                    .getResponse();
            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode == 403) {
                    return responseBuilder
                        .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
                        .withAskForPermissionsConsentCard([constants.EMAIL_PERMISSION])
                        .getResponse();
                }
                console.log(JSON.stringify(error));
                const response = responseBuilder.speak(constants.messages.ERROR).getResponse();
                return response;
            }
        }
    },

    AskForOrderStatusIntentHandler: {
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

            let slotValues = helper.getSlotValues(request.intent.slots);

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
    },

    OrderStatusIntentHandler: {
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

            let slotValues = helper.getSlotValues(request.intent.slots);
            // helper.getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

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

                let cardText = `Order: ${name}`;
                let largeImageUrl = "https://www.apple.com/v/iphone-11-pro/c/images/overview/display/pro_display_hero_1_dark__bs3bzy9s1seq_large_2x.jpg";
                let smallImageUrl = "https://www.apple.com/v/iphone-11-pro/c/images/overview/display/pro_display_hero_1_dark__bs3bzy9s1seq_large_2x.jpg";
                
                sessionAttributes['OrderName'] = name;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                return responseBuilder
                    .addDelegateDirective({
                        name: 'OrderActionsIntent',
                        confirmationStatus: 'NONE',
                        slots: {}
                    })
                    .speak(say)
                    .withStandardCard(
                        constants.APP_NAME,
                        cardText,
                        smallImageUrl, largeImageUrl)
                    .reprompt("Would you like to reschedule or cancel this order?")
                    .getResponse();
            } else if (!slotValues.nameSlot.heardAs) {
                return responseBuilder
                    .speak("Can you tell me the name of the order?")
                    .reprompt("What's the name of the order?")
                    .getResponse();
            }
        }
    },

    OrderActionsIntentHandler: {
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

            let slotValues = helper.getSlotValues(request.intent.slots);

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
    },

    RescheduleOrderIntentHandler: {
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

            let slotValues = helper.getSlotValues(request.intent.slots);
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
    },

    CancelOrderIntentHandler: {
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

            let slotValues = helper.getSlotValues(request.intent.slots);
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
    }
}