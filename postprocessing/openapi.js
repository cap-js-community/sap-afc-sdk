"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_RESPONSES = require("./default-responses");

(() => {
  processSchedulingProviderService("./openapi/SchedulingProviderService.openapi3.json");
})();

function processSchedulingProviderService(file) {
  const filePath = path.join(process.cwd(), file);
  const input = require(filePath);
  input.components.parameters = {};
  input.components.responses = DEFAULT_RESPONSES;
  input.components.schemas.error = {
    type: "object",
    required: ["code", "message"],
    properties: {
      code: {
        type: "string",
      },
      message: {
        type: "string",
      },
    },
  };
  delete input.components.schemas.count;

  const ORDER_BY_TAG = ["JobDefinition", "Job", "JobResult"];

  delete input["x-sap-api-type"];
  delete input["x-odata-version"];
  delete input["x-sap-shortText"];
  input.info.version = "1.0.0";

  input.components.schemas["SchedulingProviderService.JobParameter-create"].required = ["name", "value"];
  input.components.schemas["SchedulingProviderService.Job-create"].required = ["name", "referenceID"];
  input.components.schemas["SchedulingProviderService.Job"].required = [
    "ID",
    "name",
    "referenceID",
    "version",
    "status",
  ];
  input.components.schemas["SchedulingProviderService.JobDefinition"].required = ["name", "version"];
  input.components.schemas["SchedulingProviderService.JobParameterDefinition"].required = [
    "name",
    "dataType",
    "type",
    "mappingType",
  ];
  input.components.schemas["SchedulingProviderService.JobParameter"].required = ["ID", "name", "value"];
  delete input.components.schemas["SchedulingProviderService.JobResult"].properties.data;
  delete input.components.schemas["SchedulingProviderService.JobResult-create"];
  delete input.components.schemas["SchedulingProviderService.JobResultMessage-create"];
  delete input.components.schemas["SchedulingProviderService.Job-create"].properties.results;

  delete input.paths["/JobResult"];
  delete input.paths["/JobResult/{ID}/SchedulingProviderService.data"];
  input.paths["/JobResult/{ID}/data"] = {
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

  const visitedTags = {};
  for (let pathKey in input.paths) {
    const [entity] = pathKey.substring(1, pathKey.length).split("/");
    if (!ORDER_BY_TAG.includes(entity)) {
      delete input.paths[pathKey];
    }
    const keyParts = pathKey.split("/");
    const lastKeyPart = keyParts.pop();
    if (lastKeyPart.includes(".")) {
      const [, action] = lastKeyPart.split(".");
      keyParts.push(action);
      const newKey = keyParts.join("/");
      input.paths[newKey] = input.paths[pathKey];
      delete input.paths[pathKey];
      pathKey = newKey;
    }
    const path = input.paths[pathKey];
    for (const method in path) {
      const pathMethod = path[method];
      pathMethod.tags = [entity];
      visitedTags[entity] = 1;
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

  input.tags = input.tags
    .map(({ name }) => name)
    .reduce(
      (result, tag) => {
        if (!visitedTags[tag]) {
          return result;
        }

        if (!result.includes(tag)) {
          result.push(tag);
        }
        return result;
      },
      [...ORDER_BY_TAG],
    )
    .map((tag) => ({ name: tag }));

  for (const schemaKey in input.components.schemas) {
    const schema = input.components.schemas[schemaKey];
    for (const propertyName in schema.properties) {
      const property = schema.properties[propertyName];
      delete property.nullable;
      if (!schemaKey.endsWith("-create") && property.type === "array") {
        delete schema.properties[propertyName];
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(input, null, 2));
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
