"use strict";

sap.ui.define([], function () {
  return {
    onPress: function (oEvent) {
      const baseUrl = this.getModel().getServiceUrl();
      const ID = oEvent.getObject?.()?.ID ?? oEvent.getSource?.().getBindingContext?.().getObject()?.ID;
      if (ID) {
        window.open(`${baseUrl}JobResult(${ID})/data`, "_self");
      }
    },
  };
});
