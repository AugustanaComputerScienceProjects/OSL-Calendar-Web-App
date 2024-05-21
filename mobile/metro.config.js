// Learn more https://docs.expo.io/guides/customizing-metro
const {getSentryExpoConfig} = require('@sentry/react-native/metro');

// This replaces `const config = getDefaultConfig(__dirname);`
const config = getSentryExpoConfig(__dirname);

module.exports = config;
