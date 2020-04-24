'use strict';
const utils = require('../utils');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.blast2000 = async (event, context) => {
  const params = {
    TableName: process.env.DYNAMODB_SWAB_TABLE,
    Key: {
      id: '2000'
    }
  };
  try {
    const dbRes = await dynamoDb.get(params).promise();
    const phoneNumbers = dbRes.Item.phoneNumbers;
    if (phoneNumbers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          data: []
        })
      }
    }
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const text = 'Go to clinic (near rows 18 and 19, bed 1) for your swab test at 8am on '
      + tmr.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"}) + ' (tomorrow)\n- Medical Team';
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

module.exports.blast0800 = async (event, context) => {
  const params = {
    TableName: process.env.DYNAMODB_SWAB_TABLE,
    Key: {
      id: '0800'
    }
  };
  try {
    const dbRes = await dynamoDb.get(params).promise();
    const phoneNumbers = dbRes.Item.phoneNumbers;
    if (phoneNumbers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          data: []
        })
      }
    }
    const tdy = new Date();
    const text = 'Go to clinic (near rows 18 and 19, bed 1) for your swab test at 10am on '
      + tdy.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"}) + ' (today)\n- Medical Team';
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

