"use strict";

module.exports = {
  schedulingCodeList: require("./srv/scheduling/common/codelist"),
  SchedulingProviderService: require("./srv/scheduling/provider-service"),
  SchedulingProcessingService: require("./srv/scheduling/processing-service"),
  SchedulingMonitoringService: require("./srv/scheduling/monitoring-service"),
  SchedulingWebsocketService: require("./srv/scheduling/websocket-service"),
};
