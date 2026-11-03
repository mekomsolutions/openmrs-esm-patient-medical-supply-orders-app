const config = require('openmrs/default-rspack-config');

// Patient common lib is published as TypeScript source.
config.scriptRuleConfig.exclude = /node_modules[\\/](?!@openmrs[\\/]esm-patient-common-lib)/;

module.exports = config;
