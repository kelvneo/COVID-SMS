'use strict';
const utils = require('../utils');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: process.env.DYNAMODB_MASTER_TABLE,
};

module.exports.blast = async (event, context) => {
  try {
    const dbRes = await dynamoDb.scan(params).promise();
    const phoneNumbers = dbRes.Items.map((doc) => doc.phoneNumbers).flat();
    if (phoneNumbers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          data: []
        })
      }
    }
    const text = 'Please be reminded to do your daily vitals taking at the booth by 4pm today. Thank you!\n- Medical Team';
    const results = await utils.sendChunk(phoneNumbers, text);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: results.map(res => res.data)
      })
    };
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

