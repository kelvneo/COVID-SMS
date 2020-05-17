const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

const utils = require('../utils');

module.exports.fetch = async (event, context) => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const tmrString = date.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "2-digit"});
  try {
    console.log('Pulling swab data from Dropbox...');
    const folder = await dbx.filesListFolder({
      path: process.env.DROPBOX_SWAB_JSON_FOLDER
    });

    // Filter out all .json files first
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

        return Object.entries(data['timings']).map(([key, value]) => {
          const paramsMsg = {};
          paramsMsg['date'] = `tomorrow (${tmrString})`;
          paramsMsg['time'] = `${key}hrs`;
  
          return {
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
