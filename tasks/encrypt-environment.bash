#!/bin/bash
set -e

jet encrypt docker/staging.env docker/staging.env.encrypted --key-path=mirainc_lightspeed-retail-app.aes
jet encrypt docker/prod.env docker/prod.env.encrypted --key-path=mirainc_lightspeed-retail-app.aes
