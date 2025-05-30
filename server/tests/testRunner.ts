#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const COVERAGE_THRESHOLD = 95;
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  unit?: boolean;
  integration?: boolean;
  pattern?: string;
  verbose?: boolean;
}

class TestRunner {
  private options: TestOptions;

  constructor(options: TestOptions = {}) {
    this.options = options;
  }

  /**
   * Run tests with specified options
   */
  async run(): Promise<void> {
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
    } catch (error: any) {
      console.error('\n❌ Tests failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Build Jest command based on options
   */
  private buildCommand(): string {
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

  /**
   * Check coverage results against threshold
   */
  private async checkCoverage(): Promise<void> {
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

/**
 * Parse command line arguments
 */
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {};
  
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
          const nextArg = args[++i];
          if (nextArg !== undefined) {
            options.pattern = nextArg;
          }
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

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
🧪 Test Runner

Usage: npm run test:runner [options]

Options:
  -w, --watch         Run tests in watch mode
  -c, --coverage      Generate coverage report
  -u, --unit          Run only unit tests
  -i, --integration   Run only integration tests
  -p, --pattern       Run tests matching pattern
  -v, --verbose       Verbose output
  -h, --help          Show this help

Examples:
  npm run test:runner --coverage                    # Run all tests with coverage
  npm run test:runner --unit --watch                # Watch unit tests
  npm run test:runner --integration --verbose       # Run integration tests with verbose output
  npm run test:runner --pattern="auth" --coverage   # Run auth-related tests with coverage
  `);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const runner = new TestRunner(options);
    await runner.run();
  } catch (error: any) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { TestRunner }; 