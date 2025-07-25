#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Running linting checks...\n');

// Run ESLint
console.log('📋 Running ESLint...');
const eslint = spawn('yarn', ['lint:check'], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

eslint.on('close', (eslintCode) => {
  if (eslintCode === 0) {
    console.log('✅ ESLint passed!\n');
    
    // Run Prettier check
    console.log('🎨 Running Prettier check...');
    const prettier = spawn('yarn', ['format:check'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    prettier.on('close', (prettierCode) => {
      if (prettierCode === 0) {
        console.log('✅ Prettier check passed!');
        console.log('\n🎉 All linting checks passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Prettier check failed!');
        console.log('💡 Run "yarn format" to fix formatting issues.');
        process.exit(1);
      }
    });
  } else {
    console.log('\n❌ ESLint failed!');
    console.log('💡 Run "yarn lint:fix" to fix auto-fixable issues.');
    process.exit(1);
  }
}); 