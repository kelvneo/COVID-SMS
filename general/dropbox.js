'use strict';
// const AWS = require('aws-sdk');
// const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const utils = require('../utils');

/**
 * Pulls all .JSON files from a Dropbox folder.
 * 
 * For the format of each file, please look at `pullFromFile` function
 * 
 * @param {string} path Absolute path to the Dropbox folder
 */
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
 * @param {string} path Absolute path to the Dropbox file.
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

/**
 * 
 */
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

  const resStrings = results.filter(val => val.status === 'fulfilled').map(res => res.value.data);
  console.log(resStrings);

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: resStrings
    })
  };
}


module.exports.blastBulk = async (event, context) => {
  try {
    if (!event.path) {
      console.error('No path found!');
      throw Error('No path found!');
    }
  
    var files = [];
    if (event.folder) {
      // Get the files in the folder
      console.log('Pulling data from Dropbox...');
      const folder = await dbx.filesListFolder({
        path: event.path
      });
      files = folder.entries.filter((fm) => (fm.is_downloadable && fm.path_lower.endsWith('.json'))).map(file_metadata => file_metadata.path_lower);
    } else {
      // Just add 1 file into the array
      files.push(event.path);
    }

    // Process individual files
    const filesData = (await Promise.allSettled(files.map(path => {
      console.log(`Downloading from "${path}"`)
      return dbx.filesDownload({
        path: path
      });
    }))).filter(val => val.status === 'fulfilled').map(val => {
      const file = val.value;
      console.log(`Processing '${file.path_lower}'`)

      // Parse file as JSON, returning null to be discarded if does not fit criterias.
      const data = JSON.parse(file.fileBinary.toString());
      if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers)) {
        console.warn(`No phone numbers for '${file.path_lower}'`);
        return null;
      }
      
      const phoneNumbers = utils.cleanPhoneNumbers(data.phoneNumbers);
      if (phoneNumbers.length === 0) {
        console.warn(`Invalid phone numbers for '${file.path_lower}'`);
        return null;
      }

      return {
        text: data.msg,
        phoneNumbers: phoneNumbers
      };
    }).filter(val => val); // Filter discards all invalid files

    // Checks if there are any valid files left
    if (filesData.length === 0) {
      console.warn('No files to send!');
      return {};
    } else if (files.length !== filesData.length) {
      console.warn(`${files.length - filesData.length} will be excluded.`)
    }

    // Sends the messages out
    const fileResults = (await Promise.allSettled(filesData.map(data => utils.sendChunk(data.phoneNumbers, data.text))));
    const failedFileChunks = fileResults.filter(val => val.status !== 'fulfilled');
    if (failedFileChunks.length) {
      console.warn(`Unable to send ${failedFileChunks.length}. Please review the following:`);
      console.warn(failedFileChunks.map(val => val.reason));
    }

    const results = fileResults.filter(val => val.status === 'fulfilled').flatMap(val => val.value);
    const failedChunks = results.filter(val => val.status !== 'fulfilled');
    if (failedChunks.length) {
      console.warn(`Unable to send ${failedChunks.length}. Please review the following:`);
      console.warn(failedChunks.map(val => val.reason));
    }

    const resStrings = results.filter(val => val.status === 'fulfilled').map(res => res.value.data);
    console.log(resStrings);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: resStrings
      })
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

