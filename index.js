"use strict";

module.exports = {
  // Base
  BaseError: require("./srv/common/BaseError"),
  BaseService: require("./srv/common/BaseService"),
  BaseApplicationService: require("./srv/common/BaseApplicationService"),
  // Code-lists
  ...require("./srv/scheduling/common/codelist"),
  // Scheduling
  JobSchedulingError: require("./srv/scheduling/common/JobSchedulingError"),
  SchedulingProviderService: require("./srv/scheduling/provider-service"),
  SchedulingProcessingService: require("./srv/scheduling/processing-service"),
  SchedulingMonitoringService: require("./srv/scheduling/monitoring-service"),
  SchedulingWebsocketService: require("./srv/scheduling/websocket-service"),
};
