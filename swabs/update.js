'use strict';
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event, context) => {
  const data = JSON.parse(event.body);
  return await this.common(data, event.pathParameters.blastTime);
};

module.exports.dropbox2000 = async (event, context) => {
  try {
    const file = await dbx.filesDownload({
      path: process.env.DROPBOX_SWAB_JSON
    });
    const data = JSON.parse(file.fileBinary.toString());
    return await common(data, '2000');
  } catch (err) {
    console.error(err);
  }
}

module.exports.dropbox0800 = async (event, context) => {
  try {
    const file = await dbx.filesDownload({
      path: process.env.DROPBOX_SWAB_JSON
    });
    const data = JSON.parse(file.fileBinary.toString());
    return await common(data, '0800');
  } catch (err) {
    console.error(err);
  }
}

async function common (data, blastTime) {
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
    TableName: process.env.DYNAMODB_SWAB_TABLE,
    Item: {
      id: blastTime,
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