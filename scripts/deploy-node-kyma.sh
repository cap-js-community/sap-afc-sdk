#!/bin/bash

cd temp/afcsdk
npm install -s github:cap-js-community/sap-afc-sdk
docker system prune -a -f
npx cds up --to k8s -n afc-sdk-dev