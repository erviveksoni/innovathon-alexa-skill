var AWS = require('aws-sdk'),
    uuid = require('uuid'),
    request = require('request');

const region = "us-east-1";
const endPoint = "https://dynamodb.us-east-1.amazonaws.com";
const proactiveTableName = "proactive_event_registrations";
let documentClient = new AWS.DynamoDB.DocumentClient();

const scanTable = async (tableName) => {
    AWS.config.update({
        region: region,
        endpoint: endPoint
    });

    const params = {
        TableName: tableName,
    };

    let scanResults = [];
    let items;
    do {
        items = await documentClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    return scanResults;
};

const getUserAskToken = (all_rows, emailAddress) => {
    let result = null;
    all_rows.forEach((it) => {
        if (it.emailAddress === emailAddress) {
            result = it;
            return result;
        }
    });

    return result;
}


const getUserToken = () => {
    var options = {
        'method': 'POST',
        'url': 'https://api.amazon.com/auth/O2/token',
        'headers': {
            'Content-Type': ['application/x-www-form-urlencoded']
        },
        form: {
            'grant_type': 'client_credentials',
            'client_id': 'amzn1.application-oa2-client.2e300d7f7c094fc3b61322de911ca53f',
            'client_secret': 'ec7b55acaab8380b94e36e7f10b1cb985365f36f2e5cc3ab8a2524363dd4f628',
            'scope': 'alexa::proactive_events'
        }
    };

    return new Promise(function (resolve, reject) {
        request(options, (error, response) => {
            if (error) {
                reject(JSON.stringify(error, null, 2));
            } else {
                resolve(response.body);
            }
        });
    });
}

const sendAlexaNotification = (url, token, user_id, expectedArrival) => {
    var todaysdate = new Date();
    var nowtime = todaysdate.toISOString();

    var ms = todaysdate.getTime() + 86400000;
    var tomorrow = new Date(ms);
    var expiryTime = tomorrow.toISOString();

    var options = {
        'method': 'POST',
        'url': `${url}/v1/proactiveEvents/stages/development`,
        'headers': {
            'Authorization': `Bearer ${token}`,
            'Content-Type': ['application/json']
        },
        body: `{\n    \"timestamp\": \"${nowtime}\",\n    \"referenceId\": \"${uuid.v1()}\",\n `
            + `  \"expiryTime\": \"${expiryTime}\",\n    \"event\": {\n    \t\"name\": \"AMAZON.OrderStatus.Updated\",\n  `
            + `   \"payload\": {\n            \"state\": {\n                \"status\": \"ORDER_OUT_FOR_DELIVERY\",\n       `
            + `         \"deliveryDetails\": {\n                    \"expectedArrival\": \"${expectedArrival}\"\n           `
            + `     }\n            },\n            \"order\": {\n                \"seller\": {\n         `
            + `     \"name\": \"localizedattribute:sellerName\"\n                }\n            }\n        }\n    },\n  `
            + `       \"localizedAttributes\": [{\n\t\t\t\"locale\": \"en-US\",\n\t\t\t\"sellerName\": \"OTTO\"\n\t\t}\n\t],\n    `
            + `       \"relevantAudience\": {\n        \"type\": \"Unicast\",\n        \"payload\": {\n            \"user\": \"${user_id}\"\n        }\n    }\n}`
    };

    return new Promise(function (resolve, reject) {
        request(options, (error, response) => {
            if (error) {
                reject(JSON.stringify(error, null, 2));
            } else {
                resolve(response.body);
            }
        });
    });
}

exports.handler = async (event, context, callback) => {
    try {
        var rows = await scanTable(proactiveTableName);

        console.log("Requesting Token...")
        let authResp = await getUserToken();
        let jsonresp = JSON.parse(authResp);
        let api_token = jsonresp.access_token;
        console.log("TOKEN: " + api_token);

        event.Records.forEach(async (record) => {

            if (record.eventName == 'MODIFY') {

                var orderState = record.dynamodb.NewImage.order_state.S;
                var customerId = JSON.stringify(record.dynamodb.NewImage.customerId.S);
                var date = JSON.stringify(record.dynamodb.NewImage.deliveryInfo.M.date.S);
                var time = JSON.stringify(record.dynamodb.NewImage.deliveryInfo.M.startTime.S);

                var customerIdstring = new String();
                customerIdstring = customerId.toString().replace(/"/g, "");

                var orderStatestring = new String()
                orderStatestring = orderState.toString().replace(/"/g, "");

                console.log(`${orderStatestring} ++ ${customerIdstring} ++ ${date} ++ ${time}`);

                if (orderStatestring === "ORDER_OUT_FOR_DELIVERY") {

                    let askToken = getUserAskToken(rows, customerIdstring);

                    var todaysdate = new Date("2020-04-20 14:45:00");
                    // IST conversion
                    // todaysdate.setTime(todaysdate.getTime() + todaysdate.getTimezoneOffset() * 60 * 1000);
                    // UTC conversion
                    var nowtime = todaysdate.toISOString();

                    await sendAlexaNotification(
                        askToken.apiEndpoint,
                        api_token,
                        askToken.user_id,
                        nowtime);
                }
            }
        });

        callback(null, `Successfully processed ${event.Records.length} records.`);

    } catch (error) {
        console.log(JSON.stringify(error));

        const errorresponse = {
            statusCode: 500,
            body: JSON.stringify(error),
        };

        return errorresponse;
    }
};
