# COVID-19 Medical Team Expo 
This repository holds the code used for sending SMS reminders to patients in Singapore Expo.

It will be made defunct once an infrastructure centralizes and moves to telegram.

## Pre-requisites
You will need the following accounts in order for this to work:
- Amazon Web Services (Free Tier should be good enough)
- Serverless with AWS IAM tokens configured for Lambda and DynamoDB
- Commzgate (We use them for our SMS provider)
- Dropbox (For pulling JSON data before blasting SMS)

## Setup
1. Rename the template scripts ([template.ps1](template.ps1) or [template.sh](template.sh)) to `dev` or `prod`, whichever that suits your needs.
2. Modify the scripts and key in the required information.
3. Run the script. **(Ensure you have allowed powershell scripts to run in Windows or given execute permissions for shell script)**

You are done! Check your AWS Lambda & AWS DynamoDB to see if the functions and tables are created properly.

## Sending Messages through Dropbox
This section will detail steps to send messages from Dropbox. You will have to generate your own JSON file, and store it in Dropbox.

### General Simple Messages
_Lambda Function Name: [`covid-{stage}-generalDropboxBlastBulk`](general/dropbox.js)_

This function is for sending a single general messages.

#### JSON File
To send formattable messages, generate your JSON in this format:
```json
{
  "msg": "Please do your questionaire at https://example.com/.",
  "phoneNumbers": [
    "91234567",
    "97654321"
  ]
}
```

#### AWS Lambda Details 
You are required to call the function in AWS Lambda with the following input parameters (set `folder` to `true` to read all `.json` files in the directory)::
```json
{
    "path": "/path/to/file_or_folder_in_dropbox",
    "folder": false
}
```

### General Formattable Messages
_Lambda Function Name: [`covid-{stage}-generalDropboxBlast`](general/dropbox.js)_

This function is for sending any general messages, with the added benefit of formatting using `{}`.

#### JSON File
To send formattable messages, generate your JSON in this format:
```json
{
  "msg": "Hello {name}!",
  "data": [
    {
      "name": "KELVIN NEO",
      "phoneNumber": "91234567"
    },
    {
      "name": "TERENCE BOEY",
      "phoneNumber": "91234567"
    }
  ]
}
```
**Ensure that all elements objects in the `data` array has `phoneNumber` value, otherwise it would be discarded**

You may format your message by using `{}`, and also ensure that the key-value exists in each element of the `data` object.

#### AWS Lambda Details 
You are required to call the function in AWS Lambda with the following input parameters (set `folder` to `true` to read all `.json` files in the directory):
```json
{
    "path": "/path/to/file_or_folder_in_dropbox",
    "folder": false
}
```

## Credits
- Kelvin [@kelvneo](https://github.com/kelvneo)
- Terence [@terenceboey](https://github.com/terenceboey)
