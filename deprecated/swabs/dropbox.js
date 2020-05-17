'use strict';
// const AWS = require('aws-sdk');
// const dynamoDb = new AWS.DynamoDB.DocumentClient();
const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const utils = require('../utils');

/**
 * @deprecated Swab appointment reminders no longer required.
 */
async function pullSwabData (paramsMsg) {
  try {
    console.log('Pulling swab data from Dropbox...');
    const folder = await dbx.filesListFolder({
      path: process.env.DROPBOX_SWAB_JSON_FOLDER
    });

    // Filter out all .json files first, then download them
    const res = (await Promise.all(folder.entries.filter((fm) => (fm.is_downloadable && fm.path_lower.endsWith('.json'))).map((fileMetadata) => {
      console.log(`Downloading ${fileMetadata.path_lower}...`);
      return dbx.filesDownload({
        path: fileMetadata.path_lower
      });
    }))).flatMap((file) => {
      console.log(`Parsing ${file.path_lower}...`);
      try {
        const data = JSON.parse(file.fileBinary.toString());
        if (!data || !(data['msg']) || !(data['timings'])) {
          throw new Error('Missing JSON keys!');
        }

        // Format the message nicely
        return Object.entries(data['timings']).map(([key, value]) => {
          paramsMsg['time'] = `${key}hrs`;
          return {
            key: key,
            msg: data['msg'].formatUnicorn(paramsMsg),
            phoneNumbers: utils.cleanPhoneNumbers(value)
          };
        });
      } catch (jsonErr) {
        console.error(`${file.path_lower} is not a valid JSON file or are missing parameters.`);
        console.error(jsonErr);
        return null;
      }
    })
    return res.filter((val) => val);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * @deprecated Swab appointment reminders no longer required.
 */
module.exports.blast2000 = async (event, context) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const dateString = date.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"});

    const data = await pullSwabData({
      date: `tomorrow (${dateString})`
    });

    // Send the phone numbers out
    const results = await Promise.all(data.map((val) => {
      return utils.sendChunk(val.phoneNumbers, val.msg);
    }))

    const flResults = results.flatMap((val) => val.map((res) => res.data));
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

/**
 * @deprecated Swab appointment reminders no longer required.
 */
module.exports.blast1000 = async (event, context) => {
  try {
    const date = new Date();
    const dateString = date.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"});

    const data = await pullSwabData({
      date: `today (${dateString})`
    });

    // Filter out the timings before 10AM, and send the phone numbers out.
    const results = await Promise.all(data.filter((val) => {
      return (Number.isInteger(val.key) && parseInt(val.key) > 1000);
    }).map((val) => {
      return utils.sendChunk(val.phoneNumbers, val.msg);
    }))

    const flResults = results.flatMap((val) => val.map((res) => res.data));
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
