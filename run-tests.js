#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testConfig = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {}
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Testing Suite\n');
    
    const suites = process.argv.includes('--suite') 
      ? [process.argv[process.argv.indexOf('--suite') + 1]]
      : Object.keys(testConfig.testSuites);

    for (const suiteName of suites) {
      await this.runTestSuite(suiteName);
    }

    this.printSummary();
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  async runTestSuite(suiteName) {
    const suite = testConfig.testSuites[suiteName];
    if (!suite) {
      console.error(`❌ Test suite '${suiteName}' not found`);
      return;
    }

    console.log(`\n📋 Running ${suiteName} tests`);
    console.log(`   ${suite.description}\n`);

    this.results.suites[suiteName] = { passed: 0, failed: 0, skipped: 0 };

    // Check prerequisites
    if (suite.requiresDatabase || suite.requiresFullStack) {
      if (!await this.checkPrerequisites(suite)) {
        console.log(`⏭️  Skipping ${suiteName} - prerequisites not met`);
        this.results.suites[suiteName].skipped++;
        this.results.skipped++;
        return;
      }
    }

    // Run backend tests
    if (suite.backend) {
      await this.runTest(`${suiteName}-backend`, suite.backend);
    }

    // Run frontend tests
    if (suite.frontend) {
      await this.runTest(`${suiteName}-frontend`, suite.frontend);
    }

    // Run load tests
    if (suite.load) {
      await this.runTest(`${suiteName}-load`, suite.load);
    }

    // Run cross-browser tests
    if (suiteName === 'crossBrowser' && suite.frontend) {
      for (const browser of suite.frontend.browsers) {
        await this.runTest(`${suiteName}-${browser}`, {
          ...suite.frontend,
          command: suite.frontend.command + browser
        });
      }
    }
  }

  async runTest(testName, testConfig) {
    console.log(`  🧪 Running ${testName}...`);
    
    try {
      const startTime = Date.now();
      
      execSync(testConfig.command, {
        stdio: 'pipe',
        timeout: testConfig.timeout || 300000,
        cwd: process.cwd()
      });
      
      const duration = Date.now() - startTime;
      console.log(`  ✅ ${testName} passed (${duration}ms)`);
      
      this.results.passed++;
      const suiteName = testName.split('-')[0];
      if (this.results.suites[suiteName]) {
        this.results.suites[suiteName].passed++;
      }
      
    } catch (error) {
      console.log(`  ❌ ${testName} failed`);
      if (process.argv.includes('--verbose')) {
        console.log(`     Error: ${error.message}`);
      }
      
      this.results.failed++;
      const suiteName = testName.split('-')[0];
      if (this.results.suites[suiteName]) {
        this.results.suites[suiteName].failed++;
      }
    }
  }

  async checkPrerequisites(suite) {
    try {
      // Check if database is running
      if (suite.requiresDatabase) {
        execSync('mysqladmin ping -h localhost -P 3306 -u root -p root', { stdio: 'pipe' });
      }

      // Check if backend is running
      if (suite.requiresFullStack) {
        try {
          execSync('curl -f http://localhost:3001/health', { stdio: 'pipe' });
        } catch {
          console.log('  🔄 Starting backend server...');
          this.startBackend();
          await this.waitForBackend();
        }
      }

      return true;
    } catch (error) {
      console.log(`  ⚠️  Prerequisites check failed: ${error.message}`);
      return false;
    }
  }

  startBackend() {
    const backend = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(process.cwd(), 'backend'),
      detached: true,
      stdio: 'ignore'
    });
    
    backend.unref();
  }

  async waitForBackend(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        execSync('curl -f http://localhost:3001/health', { stdio: 'pipe' });
        console.log('  ✅ Backend server is ready');
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Backend server failed to start');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total Tests: ${this.results.passed + this.results.failed + this.results.skipped}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    
    console.log('\nSuite Breakdown:');
    for (const [suiteName, results] of Object.entries(this.results.suites)) {
      const total = results.passed + results.failed + results.skipped;
      console.log(`  ${suiteName}: ${results.passed}/${total} passed`);
    }

    // Check coverage requirements
    this.checkCoverageRequirements();
    
    // Check performance requirements
    this.checkPerformanceRequirements();
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`💥 ${this.results.failed} test(s) failed`);
    }
  }

  checkCoverageRequirements() {
    const requirements = testConfig.requirements.coverage;
    
    // Check backend coverage
    if (fs.existsSync('backend/coverage/coverage-summary.json')) {
      const backendCoverage = JSON.parse(
        fs.readFileSync('backend/coverage/coverage-summary.json', 'utf8')
      );
      
      console.log('\nBackend Coverage:');
      this.printCoverageStatus('Statements', backendCoverage.total.statements.pct, requirements.backend.statements);
      this.printCoverageStatus('Branches', backendCoverage.total.branches.pct, requirements.backend.branches);
      this.printCoverageStatus('Functions', backendCoverage.total.functions.pct, requirements.backend.functions);
      this.printCoverageStatus('Lines', backendCoverage.total.lines.pct, requirements.backend.lines);
    }

    // Check frontend coverage
    if (fs.existsSync('frontend/coverage/coverage-summary.json')) {
      const frontendCoverage = JSON.parse(
        fs.readFileSync('frontend/coverage/coverage-summary.json', 'utf8')
      );
      
      console.log('\nFrontend Coverage:');
      this.printCoverageStatus('Statements', frontendCoverage.total.statements.pct, requirements.frontend.statements);
      this.printCoverageStatus('Branches', frontendCoverage.total.branches.pct, requirements.frontend.branches);
      this.printCoverageStatus('Functions', frontendCoverage.total.functions.pct, requirements.frontend.functions);
      this.printCoverageStatus('Lines', frontendCoverage.total.lines.pct, requirements.frontend.lines);
    }
  }

  printCoverageStatus(metric, actual, required) {
    const status = actual >= required ? '✅' : '❌';
    console.log(`  ${status} ${metric}: ${actual}% (required: ${required}%)`);
  }

  checkPerformanceRequirements() {
    console.log('\nPerformance Requirements:');
    console.log(`  Response Time: < ${testConfig.requirements.responseTime.threshold}ms`);
    console.log(`  WCAG Compliance: ${testConfig.requirements.accessibility.standard}`);
    console.log(`  Load Testing: ${testConfig.requirements.performance.loadTesting.concurrentUsers} concurrent users`);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Usage: node run-tests.js [options]

Options:
  --suite <name>    Run specific test suite (unit, integration, e2e, accessibility, performance, crossBrowser)
  --verbose         Show detailed error messages
  --help           Show this help message

Examples:
  node run-tests.js                    # Run all test suites
  node run-tests.js --suite unit       # Run only unit tests
  node run-tests.js --suite e2e --verbose  # Run e2e tests with verbose output
`);
  process.exit(0);
}

// Run the tests
const runner = new TestRunner();
runner.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});