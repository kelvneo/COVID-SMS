'use strict';
const AWS = require('aws-sdk');
const utils = require('../utils');

const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * @deprecated No longer uses Amazon DynamoDB
 */
module.exports.update = async (event, context) => {
  const data = JSON.parse(event.body);
  return await this.common(data);
};

/**
 * @deprecated No longer uses Amazon DynamoDB
 */
module.exports.dropbox = async (event, context) => {
  try {
    const file = await dbx.filesDownload({
      path: process.env.DROPBOX_MASTER_JSON
    });
    const data = JSON.parse(file.fileBinary.toString());
    return await common(data);
  } catch (err) {
    console.error(err);
  }
};

/**
 * @deprecated No longer uses Amazon DynamoDB
 */
async function common (data)  {
  const timestamp = new Date().getTime();
  if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers)) {
    console.error('Body is empty!');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Body is empty!'
      })
    };
  }

  const phoneNumbers = utils.cleanPhoneNumbers(data.phoneNumbers);
  if (phoneNumbers.length === 0) {
    console.error('Invalid phone numbers!');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid phone numbers!'
      })
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_MASTER_TABLE,
    Item: {
      id: 0,
      phoneNumbers: phoneNumbers,
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
}
