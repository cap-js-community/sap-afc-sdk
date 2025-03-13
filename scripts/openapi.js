"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const DEFAULT_RESPONSES = require("./assets/default-responses");

(() => {
  const check = ["--check", "-c"].includes(process.argv?.[2]);
  processSchedulingProviderService(check);
})();

function processSchedulingProviderService(check) {
  // Load
  const filePath = path.join(process.cwd(), "./openapi/SchedulingProviderService.openapi3.json");
  const jsonBefore = fs.existsSync(filePath) ? JSON.stringify(JSON.parse(fs.readFileSync(filePath)), null, 2) : "";
  const data = JSON.parse(
    shelljs.exec("cds compile srv/scheduling/provider-service --service SchedulingProviderService --to openapi", {
      silent: true,
    }).stdout,
  );

  // Details
  data.info.version = "1.0.0";
  delete data["x-sap-api-type"];
  delete data["x-odata-version"];
  data.externalDocs = {
    description: "SAP Advanced Financial Closing SDK for CDS",
    url: "https://github.com/cap-js-community/sap-afc-sdk",
  };

  // Tags
  data.tags = [{ name: "Job Definition" }, { name: "Job" }, { name: "Job Result" }];

  // Components
  data.components.parameters = {};
  data.components.responses = DEFAULT_RESPONSES;
  data.components.schemas.error = {
    type: "object",
    required: ["code", "message"],
    properties: {
      code: {
        type: "string",
        maxLength: 255,
      },
      message: {
        type: "string",
        maxLength: 5000,
      },
    },
  };
  delete data.components.schemas.count;
  data.components.schemas["SchedulingProviderService.Job"].required = [
    "ID",
    "name",
    "referenceID",
    "version",
    "status",
  ];
  data.components.schemas["SchedulingProviderService.JobDefinition"].required = ["name", "version"];
  delete data.components.schemas["SchedulingProviderService.JobParameterDefinition"].properties.value.type;
  data.components.schemas["SchedulingProviderService.JobParameterDefinition"].properties.value.oneOf = [
    { type: "string", maxLength: 255 },
    { type: "boolean" },
    { type: "number" },
  ];
  data.components.schemas["SchedulingProviderService.JobParameterDefinition"].required = [
    "name",
    "dataType",
    "type",
    "mappingType",
  ];
  data.components.schemas["SchedulingProviderService.Job-create"].required = ["name", "referenceID"];
  data.components.schemas["SchedulingProviderService.JobParameter"].required = ["ID", "name", "value"];
  delete data.components.schemas["SchedulingProviderService.JobParameter"].properties.value.type;
  data.components.schemas["SchedulingProviderService.JobParameter"].properties.value.oneOf = [
    { type: "string", maxLength: 255 },
    { type: "boolean" },
    { type: "number" },
  ];
  data.components.schemas["SchedulingProviderService.JobParameter-create"].required = ["name", "value"];
  delete data.components.schemas["SchedulingProviderService.JobParameter-create"].properties.value.type;
  data.components.schemas["SchedulingProviderService.JobParameter-create"].properties.value.oneOf = [
    { type: "string", maxLength: 255 },
    { type: "boolean" },
    { type: "number" },
  ];

  delete data.components.schemas["SchedulingProviderService.Job-create"].properties.results;
  delete data.components.schemas["SchedulingProviderService.JobResult"].properties.data;
  delete data.components.schemas["SchedulingProviderService.JobResult-create"];
  delete data.components.schemas["SchedulingProviderService.JobResultMessage-create"];

  // Paths
  delete data.paths["/JobResult"];
  delete data.paths["/JobResult/{ID}/SchedulingProviderService.data"];
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
  for (let pathKey in data.paths) {
    const [entity] = pathKey.substring(1, pathKey.length).split("/");
    const tag = camelCaseToWords(entity);
    if (!data.tags.find((t) => t.name === tag)) {
      delete data.paths[pathKey];
      continue;
    }
    const keyParts = pathKey.split("/");
    const lastKeyPart = keyParts.pop();
    if (lastKeyPart.includes(".")) {
      const [, action] = lastKeyPart.split(".");
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
      )} based on the provided parameters.`;
    }
  }

  // Schema
  for (const schemaKey in data.components.schemas) {
    const schema = data.components.schemas[schemaKey];
    for (const propertyName in schema.properties) {
      const property = schema.properties[propertyName];
      delete property.nullable;
      if (!schemaKey.endsWith("-create") && property.type === "array") {
        delete schema.properties[propertyName];
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
