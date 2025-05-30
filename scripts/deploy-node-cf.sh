#!/bin/bash

cd temp/afcsdk
mbt build
cf deploy mta_archives/afcsdk_1.0.0.mtar