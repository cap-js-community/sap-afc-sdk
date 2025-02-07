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
  - Access endpoints and UIs

## Architecture

### Concept

- Diagram

### Design

- Diagram

## Usage

### Options

Options can be passed to the SDK via CDS environment via `cds.rerquires.sap-sfc-dk` section:

- `ui: Object | Boolean`: UI configuration. Use `false` to disable UI. Default `{}`
  - `ui.path: String`: Path to the served UI5 application. Default `''`
  - `ui.flp: Boolean`: Serve an FLP. Default `true`
  - `ui.scheduling.monitoring.job: Boolean`: Serve Scheduling Monitoring Job. Default `true`
  - `ui.api.scheduling.job.swagger: Boolean`: Serve Scheduling Provider Swagger UI. Default `true`
- `broker: Boolean`: Serve the Broker endpoint. Default `true` in `production`
- `mockProcessing: Boolean`: Activate mocked job processing. Default `false`

### Implement Job Processing

Custom Job processing can be implemented by extending the Job processing service definition as follows:

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

## Documentation

### All-in-one

- Install `@sap/cds-dk` globally: `npm install -g @sap/cds-dk`
- Init a new CDS project: `cds init <name>`
- Switch to project folder: `cd <name>`
- Add CDS features:
  - Kyma: `cds add helm,approuter,xsuaa,html5-repo --for production`
  - Cloud Foundry: `cds add mta,approuter,xsuaa,html5-repo --for production`
- Add AFC SDK: `npm add @cap-js-community/sap-afc-sdk`
- Add AFC SDK features
  - `afc add broker,sample`
- Install: `npm i`
- Deploy

### Add sample data

To add sample Job definitions run:

- `afc add sample`

### Broker

- `afc add broker`
- Deploy
- Create broker on CF:
  `cf create-service-broker <name>-broker broker-user '<broker-password>' https://<domain>/broker --space-scoped`

### Mock processing

To mock Job processing to complete jobs based on a random value (between 1 - 30s),
set CDS env option `cds.requires.sap-afc-sdk.mockProcessing: true`.

### Approuter

- `cds add approuter`

### Authentication

#### XSUAA

- Add XSUAA: `cds add xsuaa --for production`
- Change XSUAA service plan `servicePlanName` (helm) / `service-plan` (mta) from `application` to `broker`

#### IAS

- `cds add ias`

### Deployment

#### Kyma

- `cds add helm`

#### Cloud Foundry

- `cds add mta`

### HTML5 repo

Serve UIs via HTML5 repo:

- Disable serving UIs in server: `cds.requires.sap-afc-sdk.ui: false`
- `cds add html5-repo`
