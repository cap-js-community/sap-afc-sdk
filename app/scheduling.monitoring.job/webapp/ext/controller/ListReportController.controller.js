"use strict";

sap.ui.define(
  ["sap/ui/core/mvc/ControllerExtension", "sap/m/MessageToast"],
  function (ControllerExtension, MessageToast) {
    return ControllerExtension.extend("scheduling.monitoring.job.ext.controller.ListReportController", {
      override: {
        onInit: function () {
          this.base.onInit();
          window.socket.attachMessage("message", (event) => {
            const message = JSON.parse(event.getParameter("data"));
            if (message.event === "jobStatusChanged") {
              const table = this.getView().byId("scheduling.monitoring.job::JobList--fe::table::Job::LineItem::Table");
              const contexts = table.tableBindingInfo.binding.getAllCurrentContexts();
              for (const context of contexts) {
                if (context.getObject().ID === message?.data?.ID) {
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
            }
          });
        },
      },
    });
  },
);
