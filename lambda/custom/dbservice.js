const AWS = require("aws-sdk");
const region = "us-east-1";
const endPoint = "https://dynamodb.us-east-1.amazonaws.com";
const orderTableName = "order_details";
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
            ExpressionAttributeNames: {"#orderstatus": "status"},
            ExpressionAttributeValues: {":email": emailId, ":status1": status}
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

    getOrdersForProductTitle: function (emailId, productName) {
        AWS.config.update({
            region: region,
            endpoint: endPoint
        });

        let docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
            TableName: orderTableName,
            KeyConditionExpression: "customerId = :email",
            FilterExpression: "contains(productTitle, :title)",
            ExpressionAttributeValues: {":email": emailId, ":title": productName}
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
};