const AWS = require("aws-sdk");
const region = "us-east-1";
const endPoint = "https://dynamodb.us-east-1.amazonaws.com";
const orderTableName = "order_details";
const proactiveTableName = "proactive_event_registrations";

module.exports = {
    getOrdersWithStatus: function (emailId, status) {

        AWS.config.update({
            region: region,
            endpoint: endPoint
        });
        let docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
            TableName: orderTableName,
            KeyConditionExpression: "customerId = :email",
            FilterExpression: "#orderstatus = :status1",
            ExpressionAttributeNames: { "#orderstatus": "status" },
            ExpressionAttributeValues: { ":email": emailId, ":status1": status }
        };
        return new Promise(function (resolve, reject) {
            docClient.query(params, function (err, data) {
                if (err) {
                    reject(JSON.stringify(err, null, 2));
                } else {
                    resolve(data.Items);
                }
            })
        })
    },

    getOrdersForProductTitle: function (emailId, productName, status = undefined) {
        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();

        let params = {
            TableName: orderTableName,
            KeyConditionExpression: "customerId = :email",
            FilterExpression: "contains(productTitle, :title)",
            ExpressionAttributeValues: { ":email": emailId, ":title": productName }
        };

        if (status) {
            params = {
                TableName: orderTableName,
                KeyConditionExpression: "customerId = :email",
                FilterExpression: "contains(productTitle, :title) AND contains(#orderstatus, :status1)",
                ExpressionAttributeNames: { "#orderstatus": "status" },
                ExpressionAttributeValues: { ":email": emailId, ":title": productName, ":status1": status }
            };
        }

        return new Promise(function (resolve, reject) {
            docClient.query(params, function (err, data) {
                if (err) {
                    reject(JSON.stringify(err, null, 2));
                } else {
                    resolve(data.Items);
                }
            })
        })
    },

    cancelOrder: function (order) {
        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
            TableName: orderTableName,
            Key: {
                "customerId": order.customerId,
                "orderId": order.orderId
            },
            KeyConditionExpression: "customerId = :email",
            FilterExpression: "contains(productTitle, :title)",
            UpdateExpression: "set #orderstatus = :newStatus, #ordeState = :orderState",
            ExpressionAttributeNames: { "#orderstatus": "status", "#ordeState": "order_state" },
            ExpressionAttributeValues: { ":newStatus": "closed", ":orderState": "ORDER_CANCELLED" },
            ReturnValues: "UPDATED_NEW"
        };

        return new Promise(function (resolve, reject) {
            docClient.update(params, function (err, data) {
                if (err) {
                    reject(JSON.stringify(err, null, 2));
                } else {
                    resolve(data);
                }
            })
        })
    },

    rescheduleOrderWithProductTitle: function (order, deliveryInfo) {
        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
            TableName: orderTableName,
            Key: {
                "customerId": order.customerId,
                "orderId": order.orderId
            },
            KeyConditionExpression: "customerId = :email",
            FilterExpression: "contains(productTitle, :title)",
            UpdateExpression: "set #delInfo = :dInfoVal",
            ExpressionAttributeNames: { "#delInfo": "deliveryInfo" },
            ExpressionAttributeValues: { ":dInfoVal": deliveryInfo },
            ReturnValues: "UPDATED_NEW"
        };

        return new Promise(function (resolve, reject) {
            docClient.update(params, function (err, data) {
                if (err) {
                    reject(JSON.stringify(err, null, 2));
                } else {
                    resolve(data);
                }
            })
        })
    },

    registerForProactiveNotifications: function (userId, apiEndpoint) {

        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();

        let params = {
            TableName: proactiveTableName,
            Item: {
                'user_id': String(userId),
                'apiEndpoint': String(apiEndpoint),
            }
        };

        return new Promise((resolve, reject) => {
            docClient.put(params, (error, data) => {
                if (error) {
                    console.log(`Item Insert ERROR=${error.stack}`);
                    reject(JSON.stringify(error, null, 2));
                } else {
                    console.log(`Inserted Item =${JSON.stringify(data)}`);
                    resolve({ statusCode: 200, body: JSON.stringify(params.Item) });
                }
            });
        });
    },

    deleteProactiveNotificationRegistration: function (userId) {

        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();
       
        var params = {
            TableName: proactiveTableName,
            Key: {
                "user_id": String(userId)
            }
        };

        return new Promise((resolve, reject) => {

            docClient.delete(params, function(error, data) {
                if (error) {
                    console.log(`Item Delete ERROR=${error.stack}`);
                    reject(JSON.stringify(error, null, 2));
                } else {
                    console.log(`Deleted Item =${JSON.stringify(data)}`);
                    resolve({ statusCode: 200, body: JSON.stringify(data, null, 2) });
                }
            });
        });
    },
};