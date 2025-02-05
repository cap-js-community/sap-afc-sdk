"use strict";

const fs = require("fs");
const path = require("path");

const PATH = path.join(process.cwd(), "./openapi/afc-sspi.json");
const input = require(PATH);

input.components.parameters = {};

input.components.responses = {
  400: {
    description: "Incorrect request. Format or structure invalid",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  401: {
    description: "Unauthorized. Action requires user authentication",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  403: {
    description: "Access forbidden. The caller does not have the required permissions to access the resource",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  404: {
    description:
      "Resource not found. The caller either provided a wrong URL or the requested resource does not exist (any longer).",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  406: {
    description:
      "Not acceptable. The caller provided content negotiation headers such as Accept, Accept-Charset, Accept-Encoding, and Accept- Language, for which the server could not produce a matching result.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  409: {
    description: "Request conflict. State of the resource does not permit the request.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  411: {
    description: "Length required. Content-Length header required.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  413: {
    description: "Payload Too Large. The request entity is larger than limits defined by the server.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  415: {
    description:
      "Unsupported Media Type. The server refuses to accept the request because the payload has an unsupported format.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  429: {
    description: "Too many requests. The caller has sent too many requests in a given amount of time",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  500: {
    description: "Internal server error. The requested operation led to an error during execution",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  501: {
    description: "Not implemented. The server does not support the functionality required to fulfill the request",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
  },
  503: {
    description:
      "Service unavailable. The server is not able to handle the request at present. If no Retry-After is given, the client SHOULD handle the response as it would for a 500 response.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/error",
        },
      },
    },
    headers: {
      "Retry-After": {
        description:
          "Indicates how long the client should wait before making a follow-up request, specified as a number of seconds",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
        },
      },
    },
  },
};

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

const ORDER_BY_TAG = ["JobDefinition", "Job"];

delete input["x-sap-api-type"];
delete input["x-odata-version"];
delete input["x-sap-shortText"];
input.info.version = "1.0.0";

input.components.schemas["SchedulingProviderService.JobParameter-create"].required = ["name", "value"];
input.components.schemas["SchedulingProviderService.Job-create"].required = ["name", "referenceID"];
input.components.schemas["SchedulingProviderService.Job"].required = ["ID", "name", "referenceID", "version", "status"];
input.components.schemas["SchedulingProviderService.JobDefinition"].required = ["name", "version"];
input.components.schemas["SchedulingProviderService.JobParameterDefinition"].required = [
  "name",
  "dataType",
  "type",
  "mappingType",
];
input.components.schemas["SchedulingProviderService.JobParameter"].required = ["ID", "name", "value"];

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
      const schema = pathMethod.responses[200].content["application/json"].schema;
      if (schema.properties?.value?.items) {
        pathMethod.responses[200].content["application/json"].schema = {
          type: "array",
          title: schema.title,
          items: schema.properties.value.items,
        };
      }
    }
    pathMethod.responses = {
      ...pathMethod.responses,
      400: {
        $ref: "#/components/responses/400",
      },
      401: {
        $ref: "#/components/responses/401",
      },
      403: {
        $ref: "#/components/responses/403",
      },
      404: {
        $ref: "#/components/responses/404",
      },
      409: {
        $ref: "#/components/responses/409",
      },
      429: {
        $ref: "#/components/responses/429",
      },
      500: {
        $ref: "#/components/responses/500",
      },
      501: {
        $ref: "#/components/responses/501",
      },
    };
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

fs.writeFileSync(PATH, JSON.stringify(input, null, 2));
