#!/bin/bash
set -e

jet decrypt docker/staging.env.encrypted docker/staging.env --key-path=mirainc_lightspeed-retail-app.aes
jet decrypt docker/prod.env.encrypted docker/prod.env --key-path=mirainc_lightspeed-retail-app.aes
