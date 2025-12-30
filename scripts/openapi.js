"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const DEFAULT_RESPONSES = require("./assets/default-responses");

(() => {
  const check = ["--check", "-c"].includes(process.argv?.[2]);
  const skip = ["--skip", "-s"].includes(process.argv?.[2]);
  processSchedulingProviderService(check, skip);
})();

function processSchedulingProviderService(check, skip) {
  // Load
  const filePath = path.join(process.cwd(), "./openapi/SchedulingProviderV1Service.openapi3.json");
  const jsonBefore = fs.existsSync(filePath) ? JSON.stringify(JSON.parse(fs.readFileSync(filePath)), null, 2) : "";
  const data = JSON.parse(
    shelljs.exec(
      "cds compile srv/scheduling/provider-service --service sapafcsdk.scheduling.ProviderService --to openapi",
      {
        silent: true,
      },
    ).stdout,
  );

  if (!skip) {
    // Details
    data.info.version = "1.0.0";
    data.info.description += ` <a href="https://api.sap.com/api/SSPIV1/overview" target="_blank">See OpenAPI Specification on SAP Business Accelerator Hub</a>.`;
    delete data["x-sap-api-type"];
    delete data["x-odata-version"];
    data["x-sap-direction"] = "outbound";
    data.externalDocs = {
      description: "SAP Advanced Financial Closing SDK for CDS",
      url: "https://github.com/cap-js-community/sap-afc-sdk",
    };

    // Tags
    data.tags = [
      { name: "Capabilities" },
      { name: "Job Definition" },
      { name: "Job" },
      { name: "Job Result" },
      { name: "Notification" },
    ];

    // Components
    data.components.parameters = {};
    data.components.responses = DEFAULT_RESPONSES;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.Notification"].properties.value["x-extensible-enum"] =
      ["released", "active", "paused", "completed", "obsolete"];
    data.components.schemas.error = {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: {
          type: "string",
          maxLength: 255,
          description: "A machine-readable error code.",
          "x-extensible-enum": fetchErrorCodes(),
        },
        message: {
          type: "string",
          description: "A human-readable error message.",
          maxLength: 5000,
        },
      },
    };
    delete data.components.schemas.count;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.Job"].properties.createdBy.description;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.Job"].properties.modifiedBy.description;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.Job"].properties.status.description =
      "Final statuses are 'completed', 'completedWithWarning', 'completedWithError', 'failed', and 'canceled', no further status transitions are then allowed";
    data.components.schemas["sapafcsdk.scheduling.ProviderService.Job"].required = [
      "ID",
      "name",
      "referenceID",
      "version",
      "status",
    ];
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobDefinition"].required = ["name", "version"];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.value.type;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.value
      .maxLength;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.value.oneOf = [
      { type: "string", maxLength: 5000 },
      { type: "boolean" },
      { type: "number" },
    ];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.enumValues
      .items.type;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.enumValues
      .items.maxLength;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.enumValues
      .type;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.enumValues
      .items;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].properties.enumValues.oneOf =
      [
        {
          type: "array",
          items: {
            type: "string",
            maxLength: 5000,
          },
        },
        {
          type: "array",
          items: {
            type: "boolean",
          },
        },
        {
          type: "array",
          items: {
            type: "number",
          },
        },
      ];
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameterDefinition"].required = [
      "name",
      "dataType",
      "type",
    ];
    data.components.schemas["sapafcsdk.scheduling.ProviderService.Job-create"].required = ["name", "referenceID"];
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter"].required = ["ID", "name", "value"];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter"].properties.value.type;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter"].properties.value.maxLength;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter"].properties.value.oneOf = [
      { type: "string", maxLength: 5000 },
      { type: "boolean" },
      { type: "number" },
    ];
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter-create"].required = ["name", "value"];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter-create"].properties.value.type;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter-create"].properties.value
      .maxLength;
    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobParameter-create"].properties.value.oneOf = [
      { type: "string", maxLength: 5000 },
      { type: "boolean" },
      { type: "number" },
    ];

    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobResult"].required = ["ID", "type", "name"];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.Job-create"].properties.results;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobResult"].properties.data;
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobResult-create"];

    data.components.schemas["sapafcsdk.scheduling.ProviderService.JobResultMessage"].required = [
      "ID",
      "severity",
      "code",
      "text",
      "createdAt",
    ];
    delete data.components.schemas["sapafcsdk.scheduling.ProviderService.JobResultMessage-create"];

    // Paths
    data.paths["/Capabilities"].get.summary = "Retrieves capabilities.";
    const getCapabilities = data.paths["/Capabilities"].get.responses[200].content["application/json"];
    getCapabilities.schema = {
      $ref: getCapabilities.schema.properties.value.items.$ref,
    };
    data.paths["/notify"].post.requestBody.content["application/json"].examples = {
      obsolete: {
        summary: "Notification for task list status change to obsolete",
        value: {
          notifications: [
            {
              name: "taskListStatusChanged",
              ID: "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
              value: "obsolete",
            },
          ],
        },
      },
    };
    delete data.paths["/JobResult"];
    delete data.paths["/JobResult/{ID}/sapafcsdk.scheduling.ProviderService.data"];
    data.paths["/JobResult/{ID}/data"] = {
      parameters: [
        {
          description: "key: ID",
          in: "path",
          name: "ID",
          required: true,
          schema: {
            type: "string",
            maxLength: 500,
          },
        },
      ],
      get: {
        summary: "Retrieves data of a job result.",
        tags: ["JobResult"],
        parameters: [],
        responses: {
          200: {
            description: "Retrieved data",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
        },
      },
    };
    const referenceIDParameter = data.paths["/Job"].get.parameters.find(
      (parameter) => parameter.name === "referenceID",
    );
    referenceIDParameter.schema.format = "uuid";
    for (let pathKey in data.paths) {
      const [entity] = pathKey.substring(1, pathKey.length).split("/");
      const tag = nameToTag(camelCaseToWords(entity));
      if (!data.tags.find((t) => t.name === tag)) {
        delete data.paths[pathKey];
        continue;
      }
      const keyParts = pathKey.split("/");
      const lastKeyPart = keyParts.pop();
      if (lastKeyPart.includes(".")) {
        const action = lastKeyPart.split(".").pop();
        keyParts.push(action);
        const newKey = keyParts.join("/");
        data.paths[newKey] = data.paths[pathKey];
        delete data.paths[pathKey];
        pathKey = newKey;
      }
      const path = data.paths[pathKey];
      for (const method in path) {
        const pathMethod = path[method];
        pathMethod.tags = [tag];
        if (!pathMethod.responses) {
          continue;
        }
        delete pathMethod.responses["4XX"];
        if (pathMethod.responses[200]) {
          const schema = pathMethod.responses[200].content["application/json"]?.schema;
          if (schema?.properties?.value?.items) {
            pathMethod.responses[200].content["application/json"].schema = {
              type: "array",
              title: schema.title,
              items: schema.properties.value.items,
            };
          }
          if (pathMethod.parameters?.find((p) => ["skip", "top"].includes(p.name))) {
            pathMethod.responses[200].headers ??= {};
            pathMethod.responses[200].headers["x-total-count"] = {
              description: "Total number of records.",
              schema: {
                type: "number",
              },
            };
          }
        }
        pathMethod.responses = {
          ...pathMethod.responses,
          ...Object.keys(DEFAULT_RESPONSES).reduce((result, code) => {
            result[code] = {
              $ref: `#/components/responses/${code}`,
            };
            return result;
          }, {}),
        };
        pathMethod.description = `The operation allows you to ${includeInSentence(
          pathMethod.summary,
        )}${pathMethod.parameters?.length > 0 ? " based on the provided parameters" : ""}.`;
      }
    }

    // Schema
    for (const schemaKey in data.components.schemas) {
      const schema = data.components.schemas[schemaKey];
      for (const propertyName in schema.properties) {
        const property = schema.properties[propertyName];
        delete property.nullable;
        if (!schemaKey.endsWith("-create") && property.type === "array" && property.items.$ref) {
          delete schema.properties[propertyName];
        }
      }
    }
  }

  // Check or write
  const jsonAfter = JSON.stringify(data, null, 2);
  if (check) {
    if (jsonAfter !== jsonBefore) {
      // eslint-disable-next-line no-console
      console.log(`OpenAPI definition at ${filePath} is not up-to-date.`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  } else {
    fs.writeFileSync(filePath, jsonAfter);
  }
}

function includeInSentence(text) {
  text = text.charAt(0).toLowerCase() + text.slice(1);
  if (text.endsWith(".")) {
    text = text.substring(0, text.length - 1);
  }
  const words = text.split(" ");
  if (words[0].endsWith("s")) {
    words[0] = words[0].substring(0, words[0].length - 1);
  }
  return words.join(" ");
}

function camelCaseToWords(text) {
  const result = text.replace(/([A-Z])/g, " $1");
  return (result.charAt(0).toUpperCase() + result.slice(1)).trim();
}

function nameToTag(name) {
  if (["Notify"].includes(name)) {
    return "Notification";
  }
  return name;
}

function fetchErrorCodes() {
  return [
    ...fetchMessageCodes("./srv/i18n/messages.properties"),
    ...fetchMessageCodes("./srv/scheduling/i18n/messages.properties"),
  ];
}

function fetchMessageCodes(i18n) {
  const messages = fs.readFileSync(path.join(process.cwd(), i18n), "utf-8");
  const lines = messages.split("\n").filter((line) => line && !line.startsWith("#"));
  return lines.map((line) => {
    return line.split("=")[0];
  });
}
