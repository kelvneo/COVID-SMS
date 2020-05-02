'use strict';
const AWS = require('aws-sdk');
const utils = require('../utils');

const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.blast = async (event, context) => {
  try {
    console.log(`Downloading from "${process.env.DROPBOX_MASTER_JSON}"`)
    const file = await dbx.filesDownload({
      path: process.env.DROPBOX_MASTER_JSON
    });

    console.log('Processing payload...')
    const data = JSON.parse(file.fileBinary.toString());
    if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers)) {
      console.error('No phone numbers found!');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'No phone numbers found!'
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

    console.log(`Sending messages to ${phoneNumbers.length} numbers...`)
    const text = 'Please be reminded to do your daily vitals taking at the booth today. Thank you!';
    const results = await utils.sendChunk(phoneNumbers, text);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: results.map(res => res.data)
      })
    };
  } catch (err) {
    console.error(err);
  }
};
