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

### Using npm

```bash
npm install @bitmovin/player-integration-nielsen
```

Then import in your project:

```javascript
import { NielsenMeasurements } from '@bitmovin/player-integration-nielsen';
```

### Using a Script Tag

Include the library after the Bitmovin Player SDK:

```html
<!-- Bitmovin Player SDK -->
<script src="https://cdn.bitmovin.com/player/web/8/bitmovinplayer.js"></script>

<!-- Nielsen Measurement Integration -->
<script src="path/to/bitmovin-player-measurements-nielsen.js"></script>
```

When loaded via script tag, the library is available under the `bitmovin.player.measurements` namespace:

```javascript
const NielsenMeasurements = bitmovin.player.measurements.NielsenMeasurements;
```

## Quick Start

Example of how to integrate the Nielsen Measurement tracker with the Bitmovin Player.

```javascript
const playerConfig = {
    key: 'KEY',
    playback: {
        muted: true,
        autoplay: true,
    },
    advertising: {
        adBreaks: [
        {
            tag: {
            type: 'vast',
            // More Ad Samples can be found here:
            // https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/tags
            url: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dredirecterror&nofb=1&correlator=',
            },
        },
        ],
    },
};

// Sample video source
const sourceConfig = {
    title: 'Sintel',
    dash: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
    poster: 'https://bitmovin.com/wp-content/uploads/2016/06/sintel-poster.jpg',
};

bitmovin.player.Player.addModule(window.bitmovin.player['advertising-bitmovin'].default);

// Create the Bitmovin Player instance
const playerContainer = document.getElementById('player');
const player = new bitmovin.player.Player(playerContainer, playerConfig);

player.load(sourceConfig);

// Create the instance and attach it to player, with appropriate metadata for content
const NielsenMeasurements = bitmovin.player.measurements.NielsenMeasurements;
// Simplest example
/*
    const measurements = new NielsenMeasurements({
        appId: 'PTEST',
        instanceName: 'testInstance'
    });
*/

// Example of attaching Nielsen measurements with custom content metadata builder
const measurements = new NielsenMeasurements({
appId: 'PTEST',
instanceName: 'testInstance',
metadataBuilder: {
    buildContentMetadata: (player) =>
        // This example uses the default content metadata builder (withContent) but also adds a custom field
        new bitmovin.player.measurements.NielsenMetadataBuilder({
            subbrand: 'my-subbrand',
            assetId: 'Sintel',
        })
        .withContent(player)
        .withCustomField('nol_p0', 'customFieldValue'),
    },
});

measurements.attachTo(player);
```


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

## Maintenance and Updates

As an open source project, this library is not part of a regular maintenance or update schedule and is updated on an adhoc basis when contributions are made.

## Contributing to this project

We are pleased to accept changes, updates and fixes from the community wishing to use and expand this project. Bitmovin will review any Pull Requests made. We do our best to provide timely feedback, but please note that no SLAs apply. New releases are tagged and published on our discretion. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details on how to contribute.

## Raising a Feature Suggestion

If you see something missing that might be useful but are unable to contribute the feature yourself, please feel free to [submit a feature request](https://community.bitmovin.com/t/how-to-submit-a-feature-request-to-us/1463) through the Bitmovin Community. Feature suggestions will be considered by Bitmovin’s Product team for future roadmap plans.

## Reporting a bug

If you come across a bug related to this SDK, please raise this through the support ticketing system accessible in your [Bitmovin Dashboard](https://dashboard.bitmovin.com/support/tickets).

## Support and SLA Disclaimer

As an open-source project and not a core product offering, any request, issue or query related to this project is excluded from any SLA and Support terms that a customer might have with either Bitmovin or another third-party service provider or Company contributing to this project. Any and all updates are purely at the contributor's discretion.

## Need more help?

Should you need further help, please raise your request to your Bitmovin account team. We can assist in a number of ways, from providing you professional services help to putting you in touch with preferred system integrators who can work with you to achieve your goals.
