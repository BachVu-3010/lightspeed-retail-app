#!/bin/bash
set -e

export RAYDIANT_APP_LOG_LEVEL=INFO

# build with urls
RAYDIANT_APP_REVISION=$CI_COMMIT_ID raydiant-scripts build

# deploy
raydiant-scripts deploy --token=$RAYDIANT_API_TOKEN --app=$RAYDIANT_APP_ID --api=https://api.staging.raydiant.com
