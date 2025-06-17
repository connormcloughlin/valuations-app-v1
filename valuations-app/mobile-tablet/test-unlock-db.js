const { unlockDatabase } = require('./utils/db.ts');

async function testUnlock() {
  try {
    console.log('🔓 Testing database unlock...');
    await unlockDatabase();
    console.log('✅ Database unlock test completed');
  } catch (error) {
    console.error('❌ Database unlock failed:', error);
  }
}

testUnlock(); 