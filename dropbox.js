const fetch = require('isomorphic-fetch')
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({accessToken: process.env.DROPBOX_ACCESS_CODE, fetch: fetch})

module.exports.fetch = async (event, context) => {
  try {
    console.log('Pulling swab data from Dropbox...');
    const folder = await dbx.filesListFolder({
      path: process.env.DROPBOX_SWAB_JSON_FOLDER
    });
    const data = {};
    for (const fileMetadata of folder.entries) {
      if (fileMetadata.is_downloadable && fileMetadata.path_lower.endsWith('.json')) {
        console.log(`Downloading ${fileMetadata.path_lower}...`);
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
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
  }
}
