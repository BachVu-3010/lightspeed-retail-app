#!/bin/bash
set -e

jet decrypt docker/staging.env.encrypted docker/staging.env --key-path=mirainc_lightspeed-retail.aes
jet decrypt docker/prod.env.encrypted docker/prod.env --key-path=mirainc_lightspeed-retail.aes
