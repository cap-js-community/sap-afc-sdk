#!/bin/bash

shopt -s extglob

DEST_ROOT="../../afc/api/sdk"

declare -a paths=(
  "$DEST_ROOT/data/db-csv-translated/*_texts_*.csv ../db/data"
)

for entry in "${paths[@]}"; do
  src="${entry%% *}"
  dest="${entry#* }"
  cp -r $src $dest
done