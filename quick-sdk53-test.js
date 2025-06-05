#!/usr/bin/env node

/**
 * Quick SDK 53 Upgrade Test
 * Tests critical app structure and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quick SDK 53 Upgrade Test');
console.log('============================\n');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  const status = condition ? '✅ PASS' : '❌ FAIL';
  const message = `${status} ${name}${details ? ` - ${details}` : ''}`;
  console.log(message);
  
  if (condition) passed++;
  else failed++;
}

try {
  console.log('📦 Testing Package Configuration...');
  
  // Test package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  test('package.json readable', true);
  
  const deps = packageJson.dependencies || {};
  test('Expo 53 installed', deps.expo && deps.expo.includes('53'), deps.expo);
  test('React 19 available', deps.react && deps.react.includes('19'), deps.react);
  test('React Native 0.79+', deps['react-native'] && deps['react-native'].includes('0.79'), deps['react-native']);
  test('React Navigation v7', deps['@react-navigation/native'] && deps['@react-navigation/native'].includes('7'), deps['@react-navigation/native']);
  test('Expo Router v5', deps['expo-router'] && deps['expo-router'].includes('5'), deps['expo-router']);
  test('React overrides configured', packageJson.overrides && packageJson.overrides.react, packageJson.overrides?.react);
  
  console.log('\n⚙️ Testing Configuration Files...');
  
  // Test app.json
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  test('app.json readable', true);
  test('New Architecture disabled', appJson.expo?.newArchEnabled === false);
  test('Required plugins present', appJson.expo?.plugins?.length > 0, `${appJson.expo?.plugins?.length} plugins`);
  
  // Test file structure
  console.log('\n📁 Testing File Structure...');
  test('app directory exists', fs.existsSync('app'));
  test('components directory exists', fs.existsSync('components'));
  test('services directory exists', fs.existsSync('services'));
  test('api directory exists', fs.existsSync('api'));
  test('utils directory exists', fs.existsSync('utils'));
  
  // Test key files
  console.log('\n📄 Testing Key Files...');
  test('api/index.ts exists', fs.existsSync('api/index.ts'));
  test('services/mediaService.ts exists', fs.existsSync('services/mediaService.ts'));
  test('services/riskAssessmentSyncService.ts exists', fs.existsSync('services/riskAssessmentSyncService.ts'));
  test('metro.config.js exists', fs.existsSync('metro.config.js'));
  test('tsconfig.json exists', fs.existsSync('tsconfig.json'));
  
  // Test node_modules
  console.log('\n🗂️ Testing Dependencies...');
  test('node_modules exists', fs.existsSync('node_modules'));
  test('expo module exists', fs.existsSync('node_modules/expo'));
  test('react module exists', fs.existsSync('node_modules/react'));
  test('react-native module exists', fs.existsSync('node_modules/react-native'));
  
  console.log('\n' + '='.repeat(40));
  console.log('📊 SUMMARY');
  console.log('='.repeat(40));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ SDK 53 upgrade appears successful');
    console.log('✅ Ready for manual app testing');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    console.log('💡 Review failed items before proceeding');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
} 