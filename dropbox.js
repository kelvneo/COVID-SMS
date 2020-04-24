const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

module.exports.fetch = async (event, context) => {
  try {
    const file = await dbx.filesDownload({
      path: '/SAFAC Project/test.json'
    });
    const data = JSON.parse(file.fileBinary.toString());
    return data;
  } catch (err) {
    console.error(err);
  }
}
