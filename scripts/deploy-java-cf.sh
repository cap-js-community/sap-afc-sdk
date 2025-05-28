#!/bin/bash

cd temp/afcjdk
mbt build
cf deploy mta_archives/afcjdk_1.0.0-SNAPSHOT.mtar