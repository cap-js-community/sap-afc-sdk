#!/bin/bash

export BROKER_PASSWORD_HASH="sha256:pg78nhUJXTcWcD2NCOlT6hkQQA8qwxLgsZiQasutisc=:1eBRSsW3Sd7Hm3bukWS399zGNJb7d9IdnDe1uDTkSNU="
export BROKER_SERVICE_ID="c48d9d0b-4320-439e-8f4e-2ab0294bd971"
export BROKER_SERVICE_PLAN_ID="a7609272-ce22-41e0-a605-1ad3318ef2d5"
export CONTAINER_REPOSITORY=docker.io/max8995
export GLOBAL_DOMAIN=c-589f01f.stage.kyma.ondemand.com

rm -rf temp/afcsdk
mkdir -p temp
cd temp
cds init afcsdk
cd afcsdk
npm install github:cap-js-community/sap-afc-sdk
afc init kyma
afc add -a broker,stub,mock,sample,test,http
npm test
docker system prune -a -f
ctz containerize.yaml --push --logs