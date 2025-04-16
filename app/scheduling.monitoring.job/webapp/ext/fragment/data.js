"use strict";

sap.ui.define([], function () {
  return {
    onPress: function (event) {
      const baseUrl = this.getModel().getServiceUrl();
      const ID = event.getObject?.()?.ID ?? event.getSource?.().getBindingContext?.().getObject()?.ID;
      if (ID) {
        window.open(`${baseUrl}JobResult(${ID})/data`, "_self");
      }
    },
  };
});
