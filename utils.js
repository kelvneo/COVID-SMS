'use strict';
const querystring = require('querystring');
const axios = require('axios');
const COMMZGATE_API_ID = process.env.COMMZGATE_API_ID;
const COMMZGATE_API_PASSWORD = process.env.COMMZGATE_API_PASSWORD;

module.exports.sendChunk = async (phoneNumbers, text) => {
  var phoneChunks = [];
  const chunkSize = 1000;
  for (var i = 0; i < phoneNumbers.length; i += chunkSize) {
    phoneChunks.push(phoneNumbers.slice(i, i + chunkSize).join(","));
  }

  return await Promise.all(phoneChunks.map((val) => 
    axios.post('https://www.commzgate.net/gateway/SendBatchMsg.php', querystring.stringify({
      'ID': COMMZGATE_API_ID,
      'Password': COMMZGATE_API_PASSWORD,
      'Sender': 'MedicalTeam',
      'Mobile': val,
      'Batch': 'true',
      'Type': 'A',
      'Message': text
    }))
  )).catch((err) => {
    console.error(err);
    throw err;
  }); 
}

module.exports.cleanPhoneNumbers = (phoneNumbers) => {
  const spaceStrip = /(\s|\+)/gi;
  const legitPhoneCheck = /^(65)??[89]\d{7}$/gi;
  return phoneNumbers.map((val) => val.replace(spaceStrip, '')).filter((val) => val.match(legitPhoneCheck)).map((val) => {
    if (!val.startsWith('65')) {
      return '65' + val;
    } return val;
  });
}
