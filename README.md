# Bitmovin Player Web Nielsen Measurement

Typescript integration that connects the [Bitmovin Web Player SDK](https://bitmovin.com/docs/player) with the Nielsen Measurements SDK to provide audience measurement analytics.

This library listens to Bitmovin Player events, translates them into the required Nielsen events, and forwards them to the Nielsen SDK.

## Features

*   Tracks core video playback events (play, pause, seek, end, etc.).
*   Handles playback interruptions and ad breaks.
*   Constructs and sends content and ad metadata to Nielsen.
    *   Allows for customization of the metadata generation.

## Prerequisites

Before you can use this integration, you will need:

1.  A valid **Nielsen `appID`**. You must obtain this directly from your Nielsen representative.
2.  A **User Consent Management** system. Your application is responsible for gathering user consent for data collection in accordance with privacy regulations (e.g., GDPR, CCPA). This integration will only track data when consent has been provided.
3.  An active [Bitmovin Player](https://bitmovin.com/dashboard/player) license.

## Installation

TODO .... Explain installation steps once published

## Quick Start

Under `/examples` is a basic example of how to integrate the Nielsen Measurement tracker with the Bitmovin Player.


## Configuration Options

The `NielsenMeasurements` constructor accepts a configuration object with the following properties:

| Option         | Type    | Required | Description                                                                                             |
| -------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `appID`        | string  | Yes      | The application ID provided by Nielsen.                                                                 |
| `instanceName` | string  | Yes      | A unique name for this player instance.                                                                 |
| `debug`        | boolean | No       | If `true`, enables Nielsen console logging if desired. Defaults to `false`.               |
| `optOut`       | boolean | Yes       | If `true`, disables all tracking. Use this to manage user consent. Defaults to `false`.                 |
| `enableFpid`   | boolean | No        | Turn on or off the First Party ID. i.e. "true" for turn on, "false" for turn off. The default value is "true".                                                                 |
| `hem_sha1`     | string  | No        | Hashed (SHA256) value of member id, i.e. for the sample memberID "userMemberID123", the value to pass is "7ed2155ee9964d69ca425b0aceccda25d5462e06228a40d0da4dce5a4eb3e826"                                                                 |
| `uid2`         | string  | No        | Hashed (SHA256) value of UID2, i.e. for the sample UID2 "userUID2", the value to pass is "7b733f363eb756046bf72bf476d24611e931e763222a7e89537477261f7bae05"                                                                 |
| `hem_sha256`   | string  | No        | Hashed (SHA256) value of the user email address, i.e. for the sample email address "useremail@company.com", the value to pass is "0da83f9ab3bf59e3638f96d83409878fb507d3edd4d3637ca5eae4ddda5bb969"

It also accepts an optional metadata object that can be used to set default metadata paramters for the content that will be played (does not get applied to any ads)

## Content Metadata

The Nielsen SDK requires metadata about the content being played to correctly classify and report viewing data. This integration attempts to build the required metadata object from the Bitmovin Player's source information, but for accurate reporting, you should provide as much metadata as possible and/or override the metadata builder methods. More information on this can be found on the `NielsenMeasurementsConfig` class, head to the `NielsenMetadataBuilder` class to find out more about the provided methods to set your custom metadata object.

For a complete list of all available metadata fields and their descriptions, please refer to the official [Nielsen SDK Metadata Documentation](https://engineeringportal.nielsen.com/wiki/France_SDK_Metadata#Content_Metadata).


## Handling User Consent

Your application is responsible for obtaining user consent. You can disable tracking by setting the `optOut` flag during initialization.

## Development

To contribute, clone the repository and install the dependencies.

```bash
# Clone the repository
git clone https://github.com/your-username/bitmovin-player-web-nielsen-measurement.git
cd bitmovin-player-web-nielsen-measurement

# Install dependencies
npm install

# Build to run example
npm run build

# Run the example
npm start

# Run tests
npm run test

```

## How to publish a new version

```bash
# ensure to be logged
npm login
npm whoami

# publish without changing the version
npm run publish:npm

# upgrade version and publish in one step
npm run release:patch 
npm run release:minor 
npm run release:major 
```

## License

... Add LICENCE later
