'use strict';
const querystring = require('querystring');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const COMMZGATE_API_ID = process.env.COMMZGATE_API_ID;
const COMMZGATE_API_PASSWORD = process.env.COMMZGATE_API_PASSWORD;

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});

module.exports.sendChunk = async (phoneNumbers, text) => {
  var phoneChunks = [];
  const chunkSize = 1000;
  for (var i = 0; i < phoneNumbers.length; i += chunkSize) {
    phoneChunks.push(phoneNumbers.slice(i, i + chunkSize).join(","));
  }
  console.log(`Sending '${text}' to ${phoneNumbers.length} phone numbers...`);
  const newText = text + '\n- Medical Team';
  return Promise.allSettled(phoneChunks.map((val) => 
    axios.post('https://www.commzgate.net/gateway/SendBatchMsg.php', querystring.stringify({
      'ID': COMMZGATE_API_ID,
      'Password': COMMZGATE_API_PASSWORD,
      'Sender': 'MedicalTeam',
      'Mobile': val,
      'Batch': 'true',
      'Type': newText.length > 160 ? 'LA' : 'A',
      'Message': newText
    }))
  ));
}

module.exports.sendMsg = async (phoneNumber, text) => {
  const newText = text + '\n- Medical Team';
  return axios.post('https://www.commzgate.net/gateway/SendMsg', querystring.stringify({
    'ID': COMMZGATE_API_ID,
    'Password': COMMZGATE_API_PASSWORD,
    'Sender': 'MedicalTeam',
    'Mobile': phoneNumber,
    'Type': newText.length > 160 ? 'LA' : 'A',
    'Message': newText
  }));
}

module.exports.cleanPhoneNumbers = (phoneNumbers) => {
  return phoneNumbers.map((val) => this.cleanPhoneNumber(val)).filter((val) => val);
}

module.exports.cleanPhoneNumber = (phoneNumber) => {
  const spaceStrip = /(\s|\+)/gi;
  const legitPhoneCheck = /^(65)??[89]\d{7}$/gi;
  const spaceless = phoneNumber.replace(spaceStrip, '');
  if (spaceless.match(legitPhoneCheck)) {
    if (!spaceless.startsWith('65')) {
      return '65' + spaceless;
    } return spaceless;
  } else if (phoneNumber.length) {
    console.warn(`Invalid phone number: ${phoneNumber}`);
  }
  return null;
}

// Thanks StackOverflow
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
  "use strict";
  var str = this.toString();
  if (arguments.length) {
    var t = typeof arguments[0];
    var key;
    var args = ("string" === t || "number" === t) ?
      Array.prototype.slice.call(arguments)
      : arguments[0];

    for (key in args) {
      str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
    }
  }

  return str;
};
