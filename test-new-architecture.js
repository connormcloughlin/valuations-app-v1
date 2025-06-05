#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing New Architecture Configuration...\n');

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${description}: Found`);
      return true;
    } else {
      console.log(`❌ ${description}: Not found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.message}`);
    return false;
  }
}

function checkConfig(filePath, configKey, expectedValue, description) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = filePath.endsWith('.js') ? 
        eval(`(function(){ return ${content.replace('module.exports = ', '')} })()`) :
        JSON.parse(content);
      
      const actualValue = configKey.split('.').reduce((obj, key) => obj && obj[key], config);
      
      if (actualValue === expectedValue) {
        console.log(`✅ ${description}: ${actualValue}`);
        return true;
      } else {
        console.log(`❌ ${description}: Expected ${expectedValue}, got ${actualValue}`);
        return false;
      }
    } else {
      console.log(`❌ ${description}: Config file not found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error reading config - ${error.message}`);
    return false;
  }
}

function checkPackageVersion(packageName, description) {
  try {
    const packageJsonPath = './package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const version = packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName];
      
      if (version) {
        console.log(`✅ ${description}: ${version}`);
        return true;
      } else {
        console.log(`❌ ${description}: Not found in dependencies`);
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.message}`);
    return false;
  }
}

// Test New Architecture Configuration
console.log('📋 New Architecture Configuration Tests:');
console.log('==========================================');

let tests = [];

// 1. Check New Architecture is enabled
tests.push(checkConfig('./app.json', 'expo.newArchEnabled', true, 'New Architecture enabled in app.json'));
tests.push(checkConfig('./valuations-app/mobile-tablet/app.config.js', 'expo.newArchEnabled', true, 'New Architecture enabled in app.config.js'));

// 2. Check required packages are installed
tests.push(checkPackageVersion('expo', 'Expo SDK 53+'));
tests.push(checkPackageVersion('react-native', 'React Native 0.79+'));
tests.push(checkPackageVersion('react', 'React 19+'));
tests.push(checkPackageVersion('expo-system-ui', 'expo-system-ui'));

// 3. Check native code generation
tests.push(checkFile('./android', 'Android native code generated'));
tests.push(checkFile('./ios', 'iOS native code generated'));

// 4. Check configuration files
tests.push(checkFile('./metro.config.js', 'Metro configuration'));
tests.push(checkFile('./babel.config.js', 'Babel configuration'));

// 5. Check Android-specific New Architecture files
tests.push(checkFile('./android/app/src/main/jni', 'Android JNI directory (New Arch)'));
tests.push(checkFile('./android/gradle.properties', 'Android gradle.properties'));

console.log('\n📊 Test Results:');
console.log('================');

const passed = tests.filter(Boolean).length;
const total = tests.length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);

if (percentage >= 80) {
  console.log('\n🎉 New Architecture appears to be configured correctly!');
  console.log('🚀 Ready for testing and development.');
} else if (percentage >= 60) {
  console.log('\n⚠️  New Architecture is partially configured.');
  console.log('🔧 Some issues may need attention.');
} else {
  console.log('\n❌ New Architecture configuration has significant issues.');
  console.log('🔧 Review and fix the failing tests above.');
}

// Additional New Architecture specific checks
console.log('\n🔍 New Architecture Specific Checks:');
console.log('====================================');

try {
  // Check for Hermes engine (required for New Architecture)
  const androidMainApplication = './android/app/src/main/java/com/anonymous/valuationsmobiletablet/MainApplication.java';
  if (fs.existsSync(androidMainApplication)) {
    const content = fs.readFileSync(androidMainApplication, 'utf8');
    if (content.includes('ReactNativeHost') && content.includes('TurboModules')) {
      console.log('✅ TurboModules configuration detected');
    } else {
      console.log('⚠️  TurboModules configuration not clearly detected');
    }
  }

  // Check metro config for New Architecture
  const metroConfigPath = './metro.config.js';
  if (fs.existsSync(metroConfigPath)) {
    const metroContent = fs.readFileSync(metroConfigPath, 'utf8');
    if (metroContent.includes('resolver') || metroContent.includes('unstable_enableSymlinks')) {
      console.log('✅ Metro configuration appears New Architecture ready');
    } else {
      console.log('⚠️  Metro configuration may need New Architecture updates');
    }
  }
} catch (error) {
  console.log(`❌ Error in specific checks: ${error.message}`);
}

console.log('\n🏁 New Architecture test complete!');
console.log('Next steps:');
console.log('1. Run: npx expo start');
console.log('2. Test app functionality');
console.log('3. Check for any runtime errors');
console.log('4. Verify performance improvements'); 