# @cap-js-community/sap-afc-sdk

[![npm version](https://img.shields.io/npm/v/@cap-js-community/sap-afc-sdk)](https://www.npmjs.com/package/@cap-js-community/sap-afc-sdk)
[![monthly downloads](https://img.shields.io/npm/dm/@cap-js-community/sap-afc-sdk)](https://www.npmjs.com/package/@cap-js-community/sap-afc-sdk)
[![REUSE status](https://api.reuse.software/badge/github.com/cap-js-community/sap-afc-sdk)](https://api.reuse.software/info/github.com/cap-js-community/sap-afc-sdk)
[![Main CI](https://github.com/cap-js-community/sap-afc-sdk/actions/workflows/main-ci.yml/badge.svg)](https://github.com/cap-js-community/sap-afc-sdk/commits/main)

### [SAP Advanced Financial Closing SDK for CDS](https://www.npmjs.com/package/@cap-js-community/sap-afc-sdk)

> Provides an SDK for SAP Advanced Financial Closing to be consumed with
> SAP Cloud Application Programming Model (Node.js).

> ## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Usage](#usage)
- [Documentation](#documentation)

## Getting Started

- Run `npm add @cap-js-community/sap-afc-sdk` in `@sap/cds` project
- Execute `cds-serve` to start server
  - Access welcome page at http://localhost:4004
  - Access UIs and service endpoints

## Architecture

[SAP Advanced Financial Closing (AFC)](https://help.sap.com/docs/advanced-financial-closing) lets you define, automate,
process, and monitor the entity close for your organization.

The SAP Advanced Financial Closing SDK for CDS provides a plugin for [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap) (Node.js)
to extend and integrate with SAP Advanced Financial Closing (AFC). Specifically, it provides an out-of-the-box implementation
of the [SAP Advanced Financial Closing Scheduling Service Provider Interface](./openapi/afc-sspi.json) to expose a Scheduling Provider service
to manage Job definitions and Jobs. Furthermore, it brings the following out-of-the-box virtues:

- **API**: Exposes a RESTful API implementing the AFC Scheduling Provider Interface to manage Job definitions and Jobs
- **Event-Queue**: Provides an event queue to process Jobs asynchronously and resiliently (circuit breaker, retry, load-balancing, etc.)
- **Websocket**: Provides websocket connection support to monitor Job processing live
- **Feature-Toggle**: Provides a feature toggle library to control the execution of the Event Queue
- **UI**: Provides a UI5 application to monitor and cancel Jobs
- **Broker**: Implements a service broker to manage service key management to API

### Concept

The SAP Advanced Financial Closing SDK for CDS is build on the following architecture open source
building blocks as depicted in the following diagram:

![Architecture Concept](./docs/assets/architecture_concept.png)

- **https://github.com/cap-js-community/websocket**: **WebSocket Adapter for CDS**
  - Exposes a WebSocket protocol via WebSocket standard or Socket.IO for CDS services. Runs in context of the SAP Cloud Application Programming Model (CAP) using @sap/cds (CDS Node.js).
- **https://github.com/cap-js-community/event-queue**: **Event Queue for CDS**
  - The Event-Queue is a framework built on top of CAP Node.js, designed specifically for efficient and streamlined asynchronous event processing
- **https://github.com/cap-js-community/feature-toggle-library**: **Feature Toggle Library for CDS**
  - SAP BTP feature toggle library enables Node.js applications using the SAP Cloud Application Programming Model to maintain live-updatable feature toggles via Redis

You can develop a 3rd-Party Scheduling Provider for SAP Advanced Financial Closing using the SAP Advanced Financial Closing SDK,
built on the SAP Cloud Programming Model and enhanced with @cap-js-community open-source plugins, leveraging SAP Build Code for a seamless and scalable solution.

Requesting job scheduling, synchronizing status and results, and updating job definitions between SAP Advanced Financial Closing (AFC) and a 3rd-party
scheduling provider can be easily implemented using the AFC SDK.

The open source components are shared between SAP Advanced Financial Closing and the SAP Advanced Financial Closing SDK for CDS.

### Design

The architectural design of the SAP Advanced Financial Closing (AFC) SDK for implementing a Scheduling Provider is based on the SAP Cloud Application Programming Model (CAP) and SAP Build Code.
It leverages the [@cap-js-community](https://github.com/cap-js-community) open-source components to enable scheduling services in AFC.

The following diagram illustrates the high-level architecture of the SAP Advanced Financial Closing SDK for CDS:

![Architecture Design](./docs/assets/architecture_design.png)

**Key components and processing flow**:

- SAP Advanced Financial Closing (AFC):
  - Sends scheduling requests via AFC Scheduling Service Provider Interface using REST API ([Open API](./openapi/afc-sspi.json))
- Scheduling Provider Service:
  - Handles incoming scheduling requests
  - Creates scheduling jobs synchronously and places asynchronous requests into the Event Queue
- Scheduling Processing Service:
  - Processes scheduled jobs asynchronously
  - Retrieves job requests from the Event Queue and executes them.
- Scheduling WebSocket Service:
  - Listens for status updates of scheduled jobs
  - Notifies the Monitoring Scheduling Job UI via WebSockets when job statuses change
- Scheduling Monitoring Service:
  - Monitoring Scheduling Job UI (SAP Fiori Elements V4 / SAP UI5 application)
  - Reads scheduling job details from the database
  - Supports monitoring via OData V4 API
  - Displays scheduling job statuses and updates in real-time via WebSockets
- Event Queue & Feature Toggles
  - Event Queue (using CDS Outbox) facilitates asynchronous job execution
  - Feature Toggles allow influence Job and Event Queue processing dynamically
- Database & Redis Caching
  - Stores job scheduling data.
  - Redis is used for information distribution (e.g. Event Queue, WebSockets, Feature Toggles)

## Usage

### Options

Options can be passed to the SDK via CDS environment via `cds.rerquires.sap-sfc-dk` section:

- `ui: Object | Boolean`: UI configuration. Use `false` to disable UI. Default `{}`
  - `ui.path: String`: Path to the served UI5 application. Default `''`
  - `ui.flp: Boolean`: Serve an FLP. Default `true`
  - `ui.scheduling.monitoring.job: Boolean`: Serve Scheduling Monitoring Job. Default `true`
  - `ui.api.scheduling.job.swagger: Boolean`: Serve Scheduling Provider Swagger UI. Default `true`
- `broker: Boolean`: Serve the Broker endpoint. Default `true` in `production`
- `mockProcessing: Boolean | Object`: Activate mocked job processing. Default `false`
  - `mockProcessing.min: Number`: Minimum processing time in seconds. Default `0`
  - `mockProcessing.max: Number`: Maximum processing time in seconds. Default `30`
  - `mockProcessing.status: Object`: Status distribution values
    - `mockProcessing.status.completed: Number`: Completed status distribution value
    - `mockProcessing.status.completedWithError: Number`: Completed With Error status distribution value
    - `mockProcessing.status.completedWithWarning: Number`: Completed With Warning status distribution value
    - `mockProcessing.status.failed: Number`: Failed status distribution value

### Mock Job Processing

The library includes a mocked processing for jump-start development, which is disabled by default via option.
`cds.requires.sap-afc-sdk.mockProcessing: false`

Setting option `cds.requires.sap-afc-sdk.mockProcessing: true` the mocked Job processing completes
jobs based on a random time value between `0-30` seconds.

A more advanced mocked Job processing can be configured by setting the following [CDS env](https://cap.cloud.sap/docs/node.js/cds-env)
options (as described in [options](#options)):

```json
{
  "cds": {
    "requires": {
      "sap-afc-sdk": {
        "mockProcessing": {
          "min": 0,
          "max": 30,
          "status": {
            "completed": 0.5,
            "completedWithError": 0.2,
            "completedWithWarning": 0.2,
            "failed": 0.1
          }
        }
      }
    }
  }
}
```

This default advanced mocked Job processing can be also configured by using CDS profile `mock` via `--profile mock` or `CDS_ENV=mock`.

### Implement Job Processing

The basic skeleton for implementing the Job processing is already provided by the SDK. Focus can be put on the actual processing logic,
and the processing status update handling.

To implement a custom Job processing extend the Job processing service definition as follows:

- CDS file: `srv/scheduling-processing-service.cds`
  ```cds
  using SchedulingProcessingService from '@cap-js-community/sap-afc-sdk';
  annotate SchedulingProcessingService with @impl: '/srv/scheduling-processing-service.js';
  ```
- Implementation file: `srv/custom-processing-service.js`

  ```js
  "use strict";

  const SchedulingProcessingService = require("@cap-js-community/sap-afc-sdk").SchedulingProcessingService;

  class CustomSchedulingProcessingService extends SchedulingProcessingService {
    async init() {
      const { processJob, updateJob, cancelJob } = this.operations;

      this.on(processJob, async (req, next) => {
        // Your logic goes here
        await next();
      });

      this.on(updateJob, async (req, next) => {
        // Your logic goes here
        await next();
      });

      this.on(cancelJob, async (req, next) => {
        // Your logic goes here
        await next();
      });

      super.init();
    }
  }

  module.exports = CustomSchedulingProcessingService;
  ```

As part of the custom scheduling process service implementation, the following operations can be implemented:

- `processJob`:
  - A new Job instance was created and needs to be processed
  - The Job is due (start date time is reached), and the Job is ready for processing
  - Implement your custom logic, how the Job should be processed
  - Job data can be retrieved via `req.job`
  - Call `await next()` to perform default implementation (set status to `running`)
  - Throwing exceptions will automatically trigger the retry process in event queue
  - Disable mocked Job processing via `cds.requires.sap-afc-sdk.mockProcessing: false` (default).
- `updateJob`:
  - A job status update is requested
  - Implement your custom logic, how the Job status should be updated
  - Job data can be retrieved via `req.job`
  - Call `await next()` to perform default implementation (update status to requested status)
- `cancelJob`:
  - A job cancellation is requested
  - Implement your custom logic, how the Job should be canceled
  - Job data can be retrieved via `req.job`
  - Call `await next()` to perform default implementation (set status to `canceled`)

Job processing is performed as part of the Event Queue processing. The Event Queue is a framework built on top of CAP Node.js,
designed specifically for efficient and streamlined asynchronous event processing. In case of errors, the Event Queue provides
resilient processing (circuit breaker, retry, load-balancing, etc.).

## Documentation

### Bootstrap Project

A new CDS project can be initialized using [SAP Build Code](https://help.sap.com/docs/build_code)
tools on SAP Business Technology Platform (BTP) or `@sap/cds-dk` CLI command `cds init` can be used to boostrap a new CAP application.

**SAP Build Code**:

- Open SAP Build Code Lobby
- Press `Create`
- Select `Build an Application`
  - Choose `SAP Build Code`
  - Choose `Full-Stack Application`
- Provide Project Name
- Select Development Stack: `Node.js`
- Press `Create`
- Open terminal
- Continue with `cds` CLI, adding features

**CDS CLI**:

- Install `@sap/cds-dk` globally: `npm install -g @sap/cds-dk`
- Init a new CDS project: `cds init <name>`
- Switch to project folder: `cd <name>`

### All-in-one Setup

**Adding Features**:

- Add CDS features:
  - Kyma: `cds add helm,approuter,xsuaa,html5-repo --for production`
  - Cloud Foundry: `cds add mta,approuter,xsuaa,html5-repo --for production`
- Add AFC SDK: `npm add @cap-js-community/sap-afc-sdk`
- Add AFC SDK features: `afc add broker,sample,http`
- Install: `npm install`

### Step-by-step Setup

#### Add sample data

To add sample Job definitions and Job instances run:

- `afc add sample`

#### Broker

An Open Service Broker compliant broker implementation can be added to the CAP project.
The broker is used to manage service key management to the API.

- `afc add broker`
- Deploy (see above)
- Create broker on CF:
  `cf create-service-broker <name>-broker broker-user '<broker-password>' https://<domain>/broker --space-scoped`

#### Approuter

- `cds add approuter`

#### Authentication

##### XSUAA

- Add XSUAA: `cds add xsuaa --for production`
- Change XSUAA service plan `servicePlanName` (helm) / `service-plan` (mta) from `application` to `broker`

##### IAS

- `cds add ias`

### Deployment

#### Kyma

- `cds add helm`
- Follow Guide for Kyma: https://cap.cloud.sap/docs/guides/deployment/to-kyma

#### Cloud Foundry

- `cds add mta`
- Follow Guide for CF: https://cap.cloud.sap/docs/guides/deployment/to-cf

### HTML5 repo

Serve UIs via HTML5 repo:

- Disable serving UIs in server: `cds.requires.sap-afc-sdk.ui: false`
- `cds add html5-repo`

### Redis

You can scale the application by adding a Redis cache to distribute workload across application instances:

- `cds add redis`

Redis is used by event-queue, websocket and feature-toggle library to process events, distribute websocket messages and store feature toggles.

### HTTP files

- `afc add http`

### Feature Toggles

The Feature Toggle Library is used to control the execution of the Event Queue. It exposes endpoints to manage feature toggles.

`GET /rest/feature/state()`: Read current feature toggle states

The `.http` file can be used to test the feature toggle endpoints.

## MTX Tool (CF)

The MTX Tool is used to manage the application lifecycle. It can be used to manage the application in Cloud Foundry.
Details can be found at https://github.com/cap-js-community/mtx-tool.
