"use strict";

sap.ui.define(["sap/fe/core/AppComponent", "sap/ui/core/ws/WebSocket"], function (Component, WebSocket) {
  return Component.extend("scheduling.monitoring.job.Component", {
    metadata: {
      manifest: "json",
    },

    constructor: function () {
      Component.prototype.constructor.apply(this, arguments);
      window.socket = new WebSocket(this.getManifestObject().resolveUri("ws/job-scheduling"));
    },
  });
});
