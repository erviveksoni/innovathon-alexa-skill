const constants = require('./constants');
const helper = require('./helper');
const dbService = require('./dbservice');
const file = "customIntents.js";
module.exports = {
    // Custom Intent Implementation ===================================================

    OrdersIntentHandler: {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            return request.type === 'IntentRequest' && request.intent.name === 'OrdersIntent';
        },
        async handle(handlerInput) {
            // logger.info(file, handlerInput.requestEnvelope.request.intent.name, "Entry");
            console.log("Orders Intent Handler Entry");
            const {serviceClientFactory, responseBuilder, requestEnvelope} = handlerInput;

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

                // update the notification record
                await dbService.updateProactiveNotificationRegistration(requestEnvelope.context.System.user.userId, profileEmail);

                let say = 'Okay !';
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

                let orderList = await dbService.getOrdersWithStatus(profileEmail, status);
                if (orderList && orderList.length > 0) {

                    let orderTitles = orderList.map(order => order.productTitle)
                    say = `Here are your ${status} orders: ${orderTitles.join(",")}`;

                    return responseBuilder
                        .addDelegateDirective({
                            name: 'AskForOrderStatusIntent',
                            confirmationStatus: 'NONE',
                            slots: {}
                        })
                        .speak(say)
                        .withStandardCard(
                            constants.APP_NAME,
                            orderTitles.join('\n'),
                            helper.welcomeCardImg.smallImageUrl, helper.welcomeCardImg.largeImageUrl)
                        .reprompt("Would you like to know the status of any open order?")
                        .getResponse();
                } else {
                    let text = `Sorry, I could not find any ${status} orders.`;
                    return responseBuilder
                        .speak(text)
                        .withSimpleCard(constants.APP_NAME, text)
                        .withShouldEndSession(true)
                        .getResponse();
                }
            } catch (error) {
                // logger.error(file, handlerInput.requestEnvelope.request.intent.name, error.messages);
                console.log("inside catch block", error);
                if (error.statusCode == 403) {
                    return responseBuilder
                        .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
                        .withAskForPermissionsConsentCard([constants.EMAIL_PERMISSION])
                        .getResponse();
                }
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
            // logger.info(file, handlerInput.requestEnvelope.request.intent.name, "Entry");
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
                    .addDelegateDirective({
                        name: 'OrderStatusIntent',
                        confirmationStatus: 'NONE',
                        slots: {}
                    })
                    .speak(say)
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

                // delegate to Alexa to collect all the required slots
                const request = requestEnvelope.request;
                const responseBuilder = handlerInput.responseBuilder;
                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                const currentIntent = request.intent;
                if (request.dialogState && request.dialogState !== 'COMPLETED') {
                    return handlerInput.responseBuilder
                        .addDelegateDirective(currentIntent)
                        .getResponse();
                }

                // update the notification record
                await dbService.updateProactiveNotificationRegistration(requestEnvelope.context.System.user.userId, profileEmail);

                let say = '';
                let slotValues = helper.getSlotValues(request.intent.slots);

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

                    let orders = await dbService.getOrdersForProductTitle(profileEmail, name.toLowerCase());
                    if (orders && orders.length > 0) {

                        sessionAttributes['order'] = orders[0];
                        say = `Status of your order for ${orders[0].productTitle} is: ${orders[0].order_state.replace("_", " ")}`;
                        let cardText = say;

                        sessionAttributes['OrderName'] = name;
                        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                        return responseBuilder
                            .addDelegateDirective({
                                name: 'OrderActionsIntent',
                                confirmationStatus: 'NONE',
                                slots: {}
                            })
                            .speak(say)
                            .withSimpleCard(
                                constants.APP_NAME,
                                cardText)
                            .reprompt("Would you like to reschedule or cancel this order?")
                            .getResponse();
                    } else {
                        let text = `Sorry, I could not find any order for ${name}.`;
                        return responseBuilder
                            .speak(text)
                            .withSimpleCard(constants.APP_NAME, text)
                            .withShouldEndSession(true)
                            .getResponse();
                    }
                } else if (!slotValues.nameSlot.heardAs) {
                    return responseBuilder
                        .speak("Can you tell me the name of the order?")
                        .reprompt("What's the name of the order?")
                        .getResponse();
                }

            } catch (error) {
                // logger.error(file, handlerInput.requestEnvelope.request.intent.name, error.messages);
                console.log("inside catch block", error);
                if (error.statusCode == 403) {
                    return responseBuilder
                        .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
                        .withAskForPermissionsConsentCard([constants.EMAIL_PERMISSION])
                        .getResponse();
                }
                const response = responseBuilder.speak(constants.messages.ERROR).getResponse();
                return response;
            }
        }
    },

    OrderActionsIntentHandler: {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            return request.type === 'IntentRequest' && request.intent.name === 'OrderActionsIntent';
        },
        handle(handlerInput) {
            // logger.info(file, handlerInput.requestEnvelope.request.intent.name, "Entry");
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

            let slotValues = helper.getSlotValues(request.intent.slots);

            //   SLOT: confirmSlot
            if (slotValues.actionsSlot.ERstatus === 'ER_SUCCESS_MATCH') {

                let actions = slotValues.actionsSlot.resolved;
                if (actions === "nothing" || actions === "do nothing") {
                    say = `Okay! Have a nice day!`;

                    sessionAttributes['OrderName'] = '';
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                    return responseBuilder
                        .speak(say)
                        .withShouldEndSession(true)
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
            console.log("RescheduleOrderIntentHandler")
            const request = handlerInput.requestEnvelope.request;
            return request.type === 'IntentRequest' && request.intent.name === 'RescheduleOrderIntent';
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
                    return handlerInput.responseBuilder
                        .addDelegateDirective(currentIntent)
                        .getResponse();
                }

                // update the notification record
                await dbService.updateProactiveNotificationRegistration(requestEnvelope.context.System.user.userId, profileEmail);

                let say = '';

                let slotValues = helper.getSlotValues(request.intent.slots);
                console.log(JSON.stringify(slotValues))

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
                } else if ((slotValues.beforeAfterSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.beforeAfterSlot.heardAs)) {

                    return responseBuilder
                        .speak("Before of after ?")
                        .reprompt("Before or after this time ?")
                        .getResponse();
                }

                let orders = await dbService.getOrdersForProductTitle(profileEmail, name.toLowerCase(), "open");
                if (orders && orders.length > 0) {

                    let order = orders[0];
                    let deliveryInfo = {};
                    deliveryInfo.date = sessionAttributes["Day"];
                    beforeAfter === "after"
                        ? deliveryInfo.startTime = sessionAttributes["Time"]
                        : deliveryInfo.endTime = sessionAttributes["Time"];
                    dbService.rescheduleOrder(order, deliveryInfo);
                    say = `We have rescheduled your order for ${name} on ${day} ${beforeAfter} ${deliveryTime}. Have a nice day!`;

                    sessionAttributes['OrderName'] = '';
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                    return responseBuilder
                        .speak(say) // delegate to Alexa to collect all the required slots for next Intent
                        .withShouldEndSession(true)
                        .getResponse();
                } else {
                    let text = `Sorry, I could not find any open order for ${name}.`;
                    return responseBuilder
                        .speak(text)
                        .withSimpleCard(constants.APP_NAME, text)
                        .withShouldEndSession(true)
                        .getResponse();
                }
            } catch (error) {
                // logger.error(file, handlerInput.requestEnvelope.request.intent.name, error.messages);
                console.log("inside catch block", error);
                if (error.statusCode == 403) {
                    return responseBuilder
                        .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
                        .withAskForPermissionsConsentCard([constants.EMAIL_PERMISSION])
                        .getResponse();
                }
                const response = responseBuilder.speak(constants.messages.ERROR).getResponse();
                return response;
            }
        },
    },

    CancelOrderIntentHandler: {
        canHandle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            return request.type === 'IntentRequest' && request.intent.name === 'CancelOrderIntent';
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
                const responseBuilder = handlerInput.responseBuilder;
                let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

                // delegate to Alexa to collect all the required slots
                const currentIntent = request.intent;
                if (request.dialogState && request.dialogState !== 'COMPLETED') {
                    return handlerInput.responseBuilder
                        .addDelegateDirective(currentIntent)
                        .getResponse();
                }

                // update the notification record
                await dbService.updateProactiveNotificationRegistration(requestEnvelope.context.System.user.userId, profileEmail);

                let say = '';
                let slotValues = helper.getSlotValues(request.intent.slots);

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

                let orders = await dbService.getOrdersForProductTitle(profileEmail, name.toLowerCase(), "open");
                if (orders && orders.length > 0) {

                    let statusPromise = await dbService.cancelOrder(orders[0]);
                    say = `Cancelled your order for ${name}. Have a nice day!`;
                    sessionAttributes['OrderName'] = '';
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                    return responseBuilder
                        .speak(say) // delegate to Alexa to collect all the required slots for next Intent
                        .withShouldEndSession(true)
                        .getResponse();
                } else {

                    let text = `Sorry, I could not find any open order for ${name}.`;
                    return responseBuilder
                        .speak(text)
                        .withSimpleCard(constants.APP_NAME, text)
                        .withShouldEndSession(true)
                        .getResponse();
                }
            } catch (error) {
                // logger.error(file, handlerInput.requestEnvelope.request.intent.name, error.messages);
                console.log("inside catch block", error);
                if (error.statusCode == 403) {
                    return responseBuilder
                        .speak(constants.messages.NOTIFY_MISSING_PERMISSIONS)
                        .withAskForPermissionsConsentCard([constants.EMAIL_PERMISSION])
                        .getResponse();
                }
                const response = responseBuilder.speak(constants.messages.ERROR).getResponse();
                return response;
            }
        }
    }
}