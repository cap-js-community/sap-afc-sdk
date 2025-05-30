#!/bin/bash

export APPROUTER_URL=https://afcjdk-approuter-afc-sdk-dev.c-589f01f.stage.kyma.ondemand.com
export SERVER_URL=https://afcjdk-srv-afc-sdk-dev.c-589f01f.stage.kyma.ondemand.com
export BROKER_PASSWORD_HASH="sha256:pg78nhUJXTcWcD2NCOlT6hkQQA8qwxLgsZiQasutisc=:1eBRSsW3Sd7Hm3bukWS399zGNJb7d9IdnDe1uDTkSNU="
export BROKER_SERVICE_ID="d48d9d0b-4320-439e-8f4e-2ab0294bd971"
export BROKER_SERVICE_PLAN_ID="b7609272-ce22-41e0-a605-1ad3318ef2d5"
export CONTAINER_REPOSITORY=afcsdk.common.repositories.cloud.sap
# kubectl get gateway -n kyma-system kyma-gateway -o jsonpath='{.spec.servers[0].hosts[0]}' | grep -v '^$'
export GLOBAL_DOMAIN=c-589f01f.stage.kyma.ondemand.com

rm -rf temp/afcjdk
mkdir -p temp
cd temp
npx cds init afcjdk --java
cd afcjdk
npm install github:cap-js-community/sap-afc-sdk#fb-java
npx afc init kyma
npx afc add -a app,broker,stub,mock,sample,test,http
npm test