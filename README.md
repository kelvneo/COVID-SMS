# COVID-19 Medical Team Expo 
This repository holds the code used for sending SMS reminders to patients in Singapore Expo.

## Pre-requisites
You will need the following accounts in order for this to work:
- Amazon Web Services (Free Tier should be good enough)
- Serverless with AWS IAM tokens
- Commzgate (We use them for our SMS provider)
- Dropbox (For pulling JSON data before blasting SMS)

## Setup
1. Modify [template.ps1](template.ps1) and key in the required information:
    ```ps
    # Fill in everything here.
    $env:COMMZGATE_API_ID = ''
    $env:COMMZGATE_API_PASSWORD = ''
    $env:DROPBOX_ACCESS_CODE = ''

    # The file path that the JSON data will be stored in your dropbox folder (e.g. /covid/master.json)
    $env:DROPBOX_MASTER_JSON = ''
    $env:DROPBOX_SWAB_JSON = ''

    # Delete `--stage prod` if you are sending it to the dev server.
    serverless deploy --region ap-southeast-1 --stage prod
    ```
2. Rename [template.ps1](template.ps1) to `dev.ps1` or `prod.ps1`, whichever that suits your needs.
3. Run the powershell script. **(Ensure you have allowed powershell scripts to run in Windows)**

You are done! Check your AWS Lambda & AWS DynamoDB to see if the functions and tables are created properly.

## Endpoints
TODO
