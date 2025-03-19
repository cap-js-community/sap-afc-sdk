#!/bin/bash

shopt -s extglob

DEST_ROOT="../../afc/api/sdk"

declare -a paths=(
  "../app/scheduling.monitoring.job/i18n/i18n.properties        $DEST_ROOT/app/scheduling.monitoring.job/i18n/i18n.properties"
  "../app/scheduling.monitoring.job/webapp/i18n/i18n.properties $DEST_ROOT/app/scheduling.monitoring.job/webapp/i18n/i18n.properties"
  "../db/data/texts/*_texts.csv                                 $DEST_ROOT/data/db-csv-translatable"
  "../db/i18n/i18n.properties                                   $DEST_ROOT/db/i18n/i18n.properties"
  "../srv/i18n/messages.properties                              $DEST_ROOT/srv/i18n/messages.properties"
  "../srv/scheduling/i18n/messages.properties                   $DEST_ROOT/srv/scheduling/i18n/messages.properties"
  "../openapi/SchedulingProviderService.openapi3.json           $DEST_ROOT/../srv/openapi/SchedulingProviderService.openapi3.json"
)

for entry in "${paths[@]}"; do
  src="${entry%% *}"
  dest="${entry#* }"
  cp -r $src $dest
done