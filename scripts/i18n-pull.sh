#!/bin/bash

shopt -s extglob

DEST_ROOT="../../afc/api/sdk"

declare -a paths=(
  "$DEST_ROOT/app/scheduling.monitoring.job/i18n/i18n_*.properties       ../app/scheduling.monitoring.job/i18n"
  "$DEST_ROOT/app/scheduling.monitoring.job/webapp/i18n/i18_*.properties ../app/scheduling.monitoring.job/webapp/i18n"
  "$DEST_ROOT/data/db-csv-translated/*_texts_*.csv                       ../db/data"
  "$DEST_ROOT/db/i18n/i18n_*.properties                                  ../db/i18n"
  "$DEST_ROOT/srv/i18n/messages_*.properties                             ../srv/i18n"
  "$DEST_ROOT/srv/scheduling/i18n/i18n_*.properties                      ../srv/scheduling/i18n"
  "$DEST_ROOT/srv/scheduling/i18n/messages_*.properties                  ../srv/scheduling/i18n"
)

for entry in "${paths[@]}"; do
  src="${entry%% *}"
  dest="${entry#* }"
  cp -r $src $dest
done