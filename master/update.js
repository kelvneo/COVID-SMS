'use strict';
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event, context) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers)) {
    console.error('Body is empty!');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Body is empty!'
      })
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_MASTER_TABLE,
    Item: {
      id: 0,
      phoneNumbers: data.phoneNumbers,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  try {
    const dbRes = await dynamoDb.put(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item)
    };
    return response;
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message
      })
    };
  }
};

