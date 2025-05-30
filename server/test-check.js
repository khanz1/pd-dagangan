const { execSync } = require('child_process');
const path = require('path');

console.log('Checking Jest and TypeScript setup...');

try {
  // Change to server directory
  process.chdir(path.join(__dirname));
  
  console.log('Current working directory:', process.cwd());
  
  console.log('\n1. Checking Jest...');
  execSync('npx jest --version', { stdio: 'inherit' });
  
  console.log('\n2. Running simple test...');
  execSync('npx jest tests/unit/simple.test.ts --no-coverage --verbose', { 
    stdio: 'inherit'
  });
  
  console.log('\n✅ Basic test passed!');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  
  console.log('\n3. Trying TypeScript compilation check...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful');
  } catch (tsError) {
    console.error('❌ TypeScript compilation failed');
  }
} 