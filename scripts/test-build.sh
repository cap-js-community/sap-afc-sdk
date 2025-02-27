#!/bin/bash

cd temp
cds init afcsdk
cd afcsdk
npm install @cap-js-community/sap-afc-sdk
afc init cf
afc add broker,sample,http
mbt build
