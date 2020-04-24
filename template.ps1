# Fill in everything here.
$env:COMMZGATE_API_ID = ''
$env:COMMZGATE_API_PASSWORD = ''
$env:DROPBOX_ACCESS_CODE = ''

# The file path that the JSON data will be stored in your dropbox folder (e.g. /covid/master.json)
$env:DROPBOX_MASTER_JSON = ''
$env:DROPBOX_SWAB_JSON = ''

# Delete `--stage prod` if you are sending it to the dev server.
serverless deploy --region ap-southeast-1 --stage prod
