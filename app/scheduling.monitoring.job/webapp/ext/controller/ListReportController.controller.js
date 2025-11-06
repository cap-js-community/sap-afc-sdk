"use strict";

sap.ui.define(
  ["sap/ui/core/mvc/ControllerExtension", "sap/m/MessageToast"],
  function (ControllerExtension, MessageToast) {
    return ControllerExtension.extend("scheduling.monitoring.job.ext.controller.ListReportController", {
      override: {
        onInit: function () {
          this.base.onInit();
          window.websockets?.main?.message((oMessage) => {
            if (oMessage?.event === "jobStatusChanged") {
              if (oMessage.data?.status === "requested") {
                this.refreshForAll();
              } else {
                this.refreshForContext(oMessage);
              }
            }
          });
        },
      },

      refreshForContext(oMessage) {
        const table = this.getView().byId("scheduling.monitoring.job::JobList--fe::table::Job::LineItem::Table");
        const contexts = table.tableBindingInfo?.binding?.getAllCurrentContexts();
        for (const context of contexts ?? []) {
          if (oMessage.data?.IDs?.includes(context.getObject().ID)) {
            this.base.getExtensionAPI().refresh();
            const router = this.base.getAppComponent().getRouter();
            if (router && !router.getHashChanger().getHash().startsWith("Job")) {
              const toast = this.base
                .getExtensionAPI()
                .getModel("i18n")
                .getResourceBundle()
                .getText("listReportRefresh");
              MessageToast.show(toast);
            }
            break;
          }
        }
      },

      refreshForAll() {
        this.base.getExtensionAPI().refresh();
        const toast = this.base.getExtensionAPI().getModel("i18n").getResourceBundle().getText("listReportRefresh");
        MessageToast.show(toast);
      },
    });
  },
);
