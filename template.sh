#!/bin/bash
# Fill in everything here.
COMMZGATE_API_ID=''
COMMZGATE_API_PASSWORD=''
DROPBOX_ACCESS_CODE=''

# The file path that the JSON data will be stored in your dropbox folder (e.g. /covid/master.json)
DROPBOX_MASTER_JSON=''
DROPBOX_SWAB_JSON_FOLDER=''
DROPBOX_VITALS_JSON_FOLDER=''
DROPBOX_MR_JSON_FOLDER=''

# Delete `--stage prod` if you are sending it to the dev server.
serverless deploy --region ap-southeast-1 --stage prod
