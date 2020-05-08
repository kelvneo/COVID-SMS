'use strict';
// const AWS = require('aws-sdk');
// const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const utils = require('../utils');

async function pullFromFolder (path) {
  try {
    console.log('Pulling data from Dropbox...');
    // Get the files in the folder
    const folder = await dbx.filesListFolder({
      path: path
    });

    // Filter out all .json files first, then call pullFromFile to get all the data from the files.
    const res = await Promise.allSettled(folder.entries.filter((fm) => (fm.is_downloadable && fm.path_lower.endsWith('.json'))).map((fileMetadata) => {
      return pullFromFile(fileMetadata.path_lower);
    }));

    // Just throw away all the JSON files that have issues reading.
    return res.filter((val) => val.status === 'fulfilled').flatMap((val) => val.value);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Pulls a JSON file from dropbox.
 * 
 * Throw an error when the file is invalid and does not contain at least the following structure:
 * ```json
 * {
 *  "msg": "Hello {name}!",
 *  "data": {
 *    "91234567": {
 *      "name": "World"
 *    }
 *  }
 * }
 * ```
 */
async function pullFromFile (path) {
  try {
    console.log(`Downloading '${path}'...`);
    // Download the file
    const file = await dbx.filesDownload({
      path: path
    });
    
    console.log(`Parsing ${file.path_lower}...`);
    const data = JSON.parse(file.fileBinary.toString());
    if (!data || !(data['msg']) || !(data['data'])) {
      throw new Error(`${file.path_lower} does not contain required JSON keys!`);
    }

    // return Object.entries(data['data'])
    //   .map(([key, value]) => [utils.cleanPhoneNumber(key), value])
    //   .filter(([key, value]) => key)
    //   .map(([key, value]) => {
    //     return {
    //       phoneNumber: key,
    //       text: data['msg'].formatUnicorn(value)
    //     };
    //   });
    return data['data'].map((value) => {
      const phoneNumber = utils.cleanPhoneNumber(value['phoneNumber']);
      return {
        phoneNumber: phoneNumber,
        text: data['msg'].formatUnicorn(value)
      }
    }).filter(value => value.phoneNumber);
  } catch (err) {
    // This error may occur when the JSON is invalid or the file has failed to download.
    console.error(`For: ${path}`);
    console.error(err);
    throw err;
  }
}

module.exports.blast = async (event, context) => {
  if (!event.path) {
    console.error('No path found!');
    throw Error('No path found!');
  }

  var payload;
  // Check if we are reading from an entire folder
  if (event.folder) {
    payload = await pullFromFolder(event.path);
  } else {
    payload = await pullFromFile(event.path);
  }
  
  console.log(`Sending custom messages to ${payload.length} numbers...`);
  const results = await Promise.allSettled(payload.map((val) => {
    return utils.sendMsg(val.phoneNumber, val.text);
  }));
  console.log(`Results: ${results.length} API calls made.`);
  const failedRecipients = results.filter((val) => val.status !== 'fulfilled');

  if (failedRecipients.length) {
    console.warn(`Unable to send to ${failedRecipients.length} numbers. Please review the following:`);
    console.warn(failedRecipients.map(val => val.reason));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: results.filter((val) => val.status === 'fulfilled').map((val) => val.value.data)
    })
  };
}
