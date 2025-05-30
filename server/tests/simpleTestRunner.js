#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const COVERAGE_THRESHOLD = 95;
const PROJECT_ROOT = path.resolve(__dirname, '..');

class SimpleTestRunner {
  constructor(options = {}) {
    this.options = options;
  }

  async run() {
    try {
      console.log('🧪 Starting test execution...\n');
      
      // Change to project root for Jest execution
      process.chdir(PROJECT_ROOT);
      
      const command = this.buildCommand();
      console.log(`📝 Running command: ${command}\n`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
        env: { 
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      
      if (this.options.coverage) {
        await this.checkCoverage();
      }
      
      console.log('\n✅ All tests passed successfully!');
    } catch (error) {
      console.error('\n❌ Tests failed:', error.message);
      process.exit(1);
    }
  }

  buildCommand() {
    let command = 'npx jest';
    
    // Add pattern filter
    if (this.options.unit && !this.options.integration) {
      command += ' --testPathPattern="tests/unit"';
    } else if (this.options.integration && !this.options.unit) {
      command += ' --testPathPattern="tests/integration"';
    } else if (this.options.pattern) {
      command += ` --testPathPattern="${this.options.pattern}"`;
    }
    
    // Add coverage
    if (this.options.coverage) {
      command += ' --coverage';
    }
    
    // Add watch mode
    if (this.options.watch) {
      command += ' --watch';
    }
    
    // Add verbose output
    if (this.options.verbose) {
      command += ' --verbose';
    }
    
    // Force exit to prevent hanging
    if (!this.options.watch) {
      command += ' --forceExit';
    }
    
    return command;
  }

  async checkCoverage() {
    const coveragePath = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      console.warn('⚠️  Coverage report not found');
      return;
    }
    
    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const totalCoverage = coverageData.total;
      
      console.log('\n📊 Coverage Report:');
      console.log(`   Lines: ${totalCoverage.lines.pct}%`);
      console.log(`   Functions: ${totalCoverage.functions.pct}%`);
      console.log(`   Branches: ${totalCoverage.branches.pct}%`);
      console.log(`   Statements: ${totalCoverage.statements.pct}%`);
      
      const metrics = ['lines', 'functions', 'branches', 'statements'];
      const failedMetrics = metrics.filter(
        metric => totalCoverage[metric].pct < COVERAGE_THRESHOLD
      );
      
      if (failedMetrics.length > 0) {
        console.error(`\n❌ Coverage below ${COVERAGE_THRESHOLD}% threshold for:`, failedMetrics);
        process.exit(1);
      } else {
        console.log(`\n✅ All coverage metrics above ${COVERAGE_THRESHOLD}% threshold`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse coverage report:', error);
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--unit':
      case '-u':
        options.unit = true;
        break;
      case '--integration':
      case '-i':
        options.integration = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--pattern':
      case '-p':
        if (i + 1 < args.length) {
          options.pattern = args[++i];
        } else {
          console.error('Error: --pattern requires a value');
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
🧪 Simple Test Runner

Usage: node tests/simpleTestRunner.js [options]

Options:
  -w, --watch         Run tests in watch mode
  -c, --coverage      Generate coverage report
  -u, --unit          Run only unit tests
  -i, --integration   Run only integration tests
  -p, --pattern       Run tests matching pattern
  -v, --verbose       Verbose output
  -h, --help          Show this help

Examples:
  node tests/simpleTestRunner.js --coverage                    # Run all tests with coverage
  node tests/simpleTestRunner.js --unit --watch               # Watch unit tests
  node tests/simpleTestRunner.js --integration --verbose      # Run integration tests with verbose output
  node tests/simpleTestRunner.js --pattern="auth" --coverage  # Run auth-related tests with coverage
  `);
}

async function main() {
  try {
    const options = parseArgs();
    const runner = new SimpleTestRunner(options);
    await runner.run();
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { SimpleTestRunner }; 