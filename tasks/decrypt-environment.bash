#!/bin/bash
set -e

jet decrypt docker/staging.env.encrypted docker/staging.env --key-path=mirainc_appname.aes
jet decrypt docker/prod.env.encrypted docker/prod.env --key-path=mirainc_appname.aes
