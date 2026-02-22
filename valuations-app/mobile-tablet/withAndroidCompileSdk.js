// Config plugin to ensure COMPILE_SDK_VERSION is set for Android builds.
// Runs on the Android project build.gradle and injects COMPILE_SDK_VERSION = 35 into the ext block.

const { withProjectBuildGradle } = require('@expo/config-plugins');

const COMPILE_SDK = 35;

module.exports = function withAndroidCompileSdk(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      // Only handle Groovy build.gradle
      return config;
    }

    const contents = config.modResults.contents;

    if (contents.includes('COMPILE_SDK_VERSION')) {
      // If it's already defined, leave it as-is
      return config;
    }

    const extBlockRegex = /ext\s*{\s*/m;

    if (extBlockRegex.test(contents)) {
      config.modResults.contents = contents.replace(
        extBlockRegex,
        (match) => `${match}\n        COMPILE_SDK_VERSION = ${COMPILE_SDK}\n`
      );
    } else {
      // Fallback: append an ext block if none exists
      config.modResults.contents += `\next {\n    COMPILE_SDK_VERSION = ${COMPILE_SDK}\n}\n`;
    }

    return config;
  });
};


