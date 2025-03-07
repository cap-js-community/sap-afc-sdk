#!/bin/bash

export BROKER_PASSWORD_HASH="sha256:E/VwOIZC2ZKPY+VTPCg1Mfu/bFDlxgkk9AgyrzhgpHs=:WNlnGu7jfxHGwy14BoVEiFXzp9RcwGiInauL4iOTe5E="
export BROKER_SERVICE_ID="c48d9d0b-4320-439e-8f4e-2ab0294bd971"
export BROKER_SERVICE_PLAN_ID="a7609272-ce22-41e0-a605-1ad3318ef2d5"

rm -rf temp/afcsdk
mkdir -p temp
cd temp
cds init afcsdk
cd afcsdk
npm install github:cap-js-community/sap-afc-sdk
afc init cf
afc add -a broker,mock,sample,http
mbt build