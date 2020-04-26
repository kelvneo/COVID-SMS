'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const utils = require('../utils');

async function pullSwabData () {
  try {
    console.log('Pulling swab data from Dropbox...');
    const folder = await dbx.filesListFolder({
      path: process.env.DROPBOX_SWAB_JSON_FOLDER
    });
    const data = {};
    for (const fileMetadata of folder.entries) {
      if (fileMetadata.is_downloadable && fileMetadata.path_lower.endsWith('.json')) {
        console.log(`Downloading "${fileMetadata.path_lower}"...`);
        const file = await dbx.filesDownload({
          path: fileMetadata.path_lower
        });
        const temp = JSON.parse(file.fileBinary.toString());
        for (const key in temp) {
          data[key] = data[key] || [];
          data[key].push(...temp[key])
        }
      }
    }
    return data;
  } catch (err) {
    throw err;
  }
}

module.exports.blast2000 = async (event, context) => {
  try {
    const data = await pullSwabData();

    console.log('Formatting payload...');
    const results = await Promise.all(Object.entries(data).filter(([timing, rawPhoneNumbers]) => {
      return (rawPhoneNumbers && Array.isArray(rawPhoneNumbers) && utils.cleanPhoneNumbers(rawPhoneNumbers).length)
    }).map(([timing, rawPhoneNumbers]) => {
      const phoneNumbers = utils.cleanPhoneNumbers(rawPhoneNumbers);
      console.log(`${phoneNumbers.length} records found for ${timing}`);
      
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      const tmrString = tmr.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"});
      const text = `Go to clinic (near rows 18 and 19, bed 1) for your swab test at ${timing}hrs tomorrow (${tmrString}).\n- Medical Team`;
      
      console.log(`Sending "${text}" to ${phoneNumbers.length} numbers...`)
      return utils.sendChunk(phoneNumbers, text);
    }));

    const flResults = results.flatMap((val) => val.map((res) => res.data))
    console.log('Results: ');
    console.log(flResults);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: flResults
      })
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports.blast1000 = async (event, context) => {
  try {
    const data = await pullSwabData();

    console.log('Formatting payload...');
    const results = await Promise.all(Object.entries(data).filter(([timing, rawPhoneNumbers]) => {
      return (rawPhoneNumbers && Array.isArray(rawPhoneNumbers) && utils.cleanPhoneNumbers(rawPhoneNumbers).length &&
        Number.isInteger(timing) && parseInt(timing) > 1000);
    }).map(([timing, rawPhoneNumbers]) => {
      const phoneNumbers = utils.cleanPhoneNumbers(rawPhoneNumbers);
      console.log(`${phoneNumbers.length} records found for ${timing}`);
      
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      const tmrString = tmr.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"});
      const text = `Go to clinic (near rows 18 and 19, bed 1) for your swab test at ${timing}hrs today (${tmrString}).\n- Medical Team`;
      
      console.log(`Sending "${text}" to ${phoneNumbers.length} numbers...`)
      return utils.sendChunk(phoneNumbers, text);
    }));

    const flResults = results.flatMap((val) => val.map((res) => res.data))
    console.log('Results: ');
    console.log(flResults);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: flResults
      })
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};
