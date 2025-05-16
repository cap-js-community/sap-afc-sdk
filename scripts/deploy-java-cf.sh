#!/bin/bash

cd temp/afcsdkjava
mbt build
cf deploy mta_archives/afcsdkjava_1.0.0.mtar