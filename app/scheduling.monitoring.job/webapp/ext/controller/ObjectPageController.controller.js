"use strict";

sap.ui.define(
  ["sap/ui/core/mvc/ControllerExtension", "sap/m/MessageToast"],
  function (ControllerExtension, MessageToast) {
    return ControllerExtension.extend("sapafcsdk.scheduling.monitoring.job.ext.controller.ObjectPageController", {
      override: {
        onInit: function () {
          this.base.onInit();
          window.websockets?.main?.message((oMessage) => {
            const object = this.base.getExtensionAPI().getBindingContext()?.getObject();
            if (oMessage.event === "jobStatusChanged") {
              if (oMessage?.data?.IDs?.includes(object?.ID)) {
                this.base.getExtensionAPI().refresh();
                const router = this.base.getAppComponent().getRouter();
                if (router && router.getHashChanger().getHash().startsWith("Job")) {
                  const toast = this.base
                    .getExtensionAPI()
                    .getModel("i18n")
                    .getResourceBundle()
                    .getText("objectPageRefresh");
                  MessageToast.show(toast);
                }
              }
            }
          });
        },
      },
    });
  },
);
