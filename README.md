# COVID-19 Medical Team Expo 
This repository holds the code used for sending SMS reminders to patients in Singapore Expo.

## Pre-requisites
You will need the following accounts in order for this to work:
- Amazon Web Services (Free Tier should be good enough)
- Serverless with AWS IAM tokens configured for Lambda and DynamoDB
- Commzgate (We use them for our SMS provider)
- Dropbox (For pulling JSON data before blasting SMS)

## Setup
1. Modify [template.ps1](template.ps1) or [template.sh](template.sh) and key in the required information:

    - Powershell
        ```ps1
        # Fill in everything here.
        $env:COMMZGATE_API_ID = ''
        $env:COMMZGATE_API_PASSWORD = ''
        $env:DROPBOX_ACCESS_CODE = ''

        # The file path that the JSON data will be stored in your dropbox folder (e.g. /covid/master.json)
        $env:DROPBOX_MASTER_JSON = ''
        $env:DROPBOX_SWAB_JSON_FOLDER = ''
        $env:DROPBOX_MR_JSON_FOLDER = ''

        # Delete `--stage prod` if you are sending it to the dev server.
        serverless deploy --region ap-southeast-1 --stage prod
        ```
    - Shell Script
        ```bash
        #!/bin/bash
        # Fill in everything here.
        COMMZGATE_API_ID=''
        COMMZGATE_API_PASSWORD=''
        DROPBOX_ACCESS_CODE=''

        # The file path that the JSON data will be stored in your dropbox folder (e.g. /covid/master.json)
        DROPBOX_MASTER_JSON=''
        DROPBOX_SWAB_JSON_FOLDER=''
        DROPBOX_MR_JSON_FOLDER=''

        # Delete `--stage prod` if you are sending it to the dev server.
        serverless deploy --region ap-southeast-1 --stage prod
        ```
2. Rename the template script to `dev` or `prod`, whichever that suits your needs.
3. Run the script. **(Ensure you have allowed powershell scripts to run in Windows or given execute permissions for shell script)**

You are done! Check your AWS Lambda & AWS DynamoDB to see if the functions and tables are created properly.

## Sending Messages through Dropbox
This section will detail steps to send messages from Dropbox. You will have to generate your own JSON file, and store it in Dropbox.

### General Messages
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

### Daily Vitals Message
_Lambda Function Name: [`covid-{stage}-blastMaster`](master/dropbox.js)_

This will send the following to all phone numbers:
> Please be reminded to do your daily vitals taking at the booth today. Thank you!`

#### JSON File
Generate the JSON with this format:
```json
{
    "phoneNumbers": [
        "91234567"
    ]
}
```

#### AWS Lambda Details 
Ensure the environment variable `DROPBOX_MASTER_JSON` is set to the path of the JSON file in Dropbox before the function is executed.

## Credits
- Kelvin [@kelvneo](https://github.com/kelvneo)
- Terence [@terenceboey](https://github.com/terenceboey)
