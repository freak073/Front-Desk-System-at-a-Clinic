# Comprehensive Testing Suite

This document describes the comprehensive testing suite implemented for the Front Desk System, covering all aspects of testing from unit tests to end-to-end accessibility and performance testing.

## Overview

The testing suite implements the following types of tests:

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database operation testing
- **Component Tests**: React component testing with React Testing Library
- **End-to-End Tests**: Complete user workflow testing with Playwright
- **Accessibility Tests**: WCAG 2.1 AA compliance testing
- **Performance Tests**: Response time and load testing
- **Cross-Browser Tests**: Compatibility testing across multiple browsers

## Requirements Validation

All tests are designed to validate the requirements specified in the requirements document:

### Performance Requirements (10.1)
- All operations must respond within 2 seconds
- System must handle concurrent users efficiently
- Load testing validates system performance under stress

### Accessibility Requirements (9.2, 9.3)
- WCAG 2.1 AA compliance testing
- Keyboard navigation support
- Screen reader compatibility
- Color contrast validation
- Focus management testing

### All Functional Requirements
- Authentication system (1.1-1.5)
- Doctor management (2.1-2.7)
- Queue management (3.1-3.8)
- Appointment management (4.1-4.9, 5.1-5.5)
- Dashboard and navigation (6.1-6.6)
- Search and filtering (7.1-7.5)
- Data persistence (8.1-8.5)
- Responsive design (9.1-9.5)

## Test Structure

```
├── backend/
│   ├── test/
│   │   ├── integration/           # API integration tests
│   │   ├── performance/           # Backend performance tests
│   │   └── artillery-processor.js # Load testing helpers
│   └── artillery.yml              # Load testing configuration
├── frontend/
│   ├── tests/
│   │   ├── components/            # React component tests
│   │   ├── e2e/                   # End-to-end tests
│   │   ├── global-setup.ts        # Test environment setup
│   │   └── global-teardown.ts     # Test environment cleanup
│   └── playwright.config.ts       # Playwright configuration
├── .github/workflows/
│   └── comprehensive-testing.yml  # CI/CD pipeline
├── test-config.json               # Test configuration
├── run-tests.js                   # Test runner script
└── TESTING.md                     # This documentation
```

## Running Tests

### Prerequisites

1. **Database Setup**:
   ```bash
   # Start MySQL database
   docker run -d --name mysql-test -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=front_desk_test -p 3306:3306 mysql:8.0
   ```

2. **Install Dependencies**:
   ```bash
   # Backend dependencies
   cd backend && npm install
   
   # Frontend dependencies
   cd frontend && npm install
   
   # Install Playwright browsers
   cd frontend && npx playwright install
   ```

### Running Individual Test Suites

#### Unit Tests
```bash
# Backend unit tests
cd backend && npm run test

# Frontend unit tests
cd frontend && npm run test

# With coverage
cd backend && npm run test:cov
cd frontend && npm run test:coverage
```

#### Integration Tests
```bash
# Backend API integration tests
cd backend && npm run test:integration
```

#### Component Tests
```bash
# React component tests
cd frontend && npm run test:components
```

#### End-to-End Tests
```bash
# All E2E tests
cd frontend && npm run test:e2e

# With UI mode
cd frontend && npm run test:e2e:ui

# Specific test files
cd frontend && npx playwright test tests/e2e/auth.spec.ts
```

#### Accessibility Tests
```bash
# WCAG 2.1 AA compliance tests
cd frontend && npm run test:accessibility
```

#### Performance Tests
```bash
# Backend performance tests
cd backend && npm run test:performance

# Frontend performance tests
cd frontend && npm run test:performance:e2e

# Load testing with Artillery
cd backend && npm run test:load
```

#### Cross-Browser Tests
```bash
# All browsers
cd frontend && npx playwright test

# Specific browser
cd frontend && npx playwright test --project=firefox
cd frontend && npx playwright test --project=webkit
```

### Running All Tests

Use the comprehensive test runner:

```bash
# Run all test suites
node run-tests.js

# Run specific suite
node run-tests.js --suite unit
node run-tests.js --suite e2e
node run-tests.js --suite accessibility

# Verbose output
node run-tests.js --verbose
```

## Test Configuration

### Coverage Requirements

- **Backend**: 80% statements, 75% branches, 80% functions, 80% lines
- **Frontend**: 85% statements, 80% branches, 85% functions, 85% lines

### Performance Requirements

- **Response Time**: All operations < 2 seconds
- **Load Testing**: 50 concurrent users for 5 minutes
- **Core Web Vitals**: FCP < 1.8s, LCP < 2.5s, CLS < 0.1

### Accessibility Requirements

- **Standard**: WCAG 2.1 AA compliance
- **Tools**: axe-core, Playwright accessibility testing
- **Coverage**: All pages and interactive elements

## Continuous Integration

The CI/CD pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Pipeline Stages

1. **Backend Tests**: Unit, integration, and performance tests
2. **Frontend Tests**: Unit and component tests
3. **E2E Tests**: Complete user workflow testing
4. **Accessibility Tests**: WCAG compliance validation
5. **Performance Tests**: Load testing and Core Web Vitals
6. **Cross-Browser Tests**: Compatibility across browsers
7. **Security Tests**: Vulnerability scanning

### Artifacts

The pipeline generates the following artifacts:
- Test reports (HTML, JSON, JUnit)
- Coverage reports (LCOV, HTML)
- Accessibility reports
- Performance reports
- Screenshots and videos of failed tests

## Test Data Management

### Test Database

Tests use a separate test database (`front_desk_test`) with:
- Automated setup and teardown
- Isolated test data for each test suite
- Seeded data for consistent testing

### Test Users

Default test credentials:
- Username: `admin`
- Password: `admin123`
- Role: `front_desk`

### Mock Data

Tests use realistic mock data including:
- Patient names and contact information
- Doctor profiles with specializations
- Appointment schedules
- Queue entries with various statuses

## Debugging Tests

### Playwright Debugging

```bash
# Run tests in debug mode
cd frontend && npx playwright test --debug

# Run with headed browser
cd frontend && npx playwright test --headed

# Generate trace files
cd frontend && npx playwright test --trace on
```

### Jest Debugging

```bash
# Run tests in debug mode
cd backend && npm run test:debug

# Run specific test file
cd frontend && npm test -- --testNamePattern="Header Component"
```

### Common Issues

1. **Database Connection**: Ensure MySQL is running and accessible
2. **Port Conflicts**: Check that ports 3000 and 3001 are available
3. **Browser Installation**: Run `npx playwright install` if browsers are missing
4. **Timeout Issues**: Increase timeout values in test configuration

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Independent Tests**: Each test should be independent
4. **Realistic Data**: Use realistic test data
5. **Error Scenarios**: Test both success and error cases

### Accessibility Testing

1. **Semantic HTML**: Use proper HTML semantics
2. **ARIA Labels**: Include appropriate ARIA attributes
3. **Keyboard Navigation**: Test all keyboard interactions
4. **Color Contrast**: Validate color contrast ratios
5. **Screen Readers**: Test with screen reader compatibility

### Performance Testing

1. **Realistic Load**: Use realistic user scenarios
2. **Gradual Ramp-up**: Gradually increase load
3. **Monitor Resources**: Track CPU, memory, and database performance
4. **Set Baselines**: Establish performance baselines
5. **Regular Testing**: Run performance tests regularly

## Reporting

### Coverage Reports

Coverage reports are generated in multiple formats:
- HTML reports for detailed analysis
- LCOV format for CI/CD integration
- Text summary for quick overview

### Test Reports

Test execution reports include:
- Pass/fail status for each test
- Execution time and performance metrics
- Screenshots and videos for failed tests
- Accessibility violation details
- Performance benchmark results

### Accessibility Reports

Accessibility reports provide:
- WCAG violation details
- Severity levels and impact
- Remediation suggestions
- Color contrast analysis
- Keyboard navigation issues

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing dependencies up to date
2. **Review Test Coverage**: Ensure coverage meets requirements
3. **Performance Baselines**: Update performance baselines as needed
4. **Browser Updates**: Test with latest browser versions
5. **Accessibility Standards**: Stay current with accessibility guidelines

### Test Data Cleanup

- Automated cleanup after each test run
- Regular database maintenance
- Remove obsolete test files
- Update mock data as needed

## Troubleshooting

### Common Test Failures

1. **Flaky Tests**: Identify and fix non-deterministic tests
2. **Timeout Issues**: Adjust timeout values for slow operations
3. **Environment Issues**: Ensure consistent test environment
4. **Data Dependencies**: Check for test data dependencies
5. **Browser Issues**: Update browser versions and drivers

### Performance Issues

1. **Slow Tests**: Optimize test execution time
2. **Resource Usage**: Monitor memory and CPU usage
3. **Database Performance**: Optimize test database queries
4. **Network Issues**: Handle network latency in tests
5. **Parallel Execution**: Balance parallelism with resource usage

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD approach
2. **Update Documentation**: Update test documentation
3. **Maintain Coverage**: Ensure coverage requirements are met
4. **Test All Scenarios**: Include positive and negative test cases
5. **Accessibility**: Include accessibility tests for new features

For questions or issues with the testing suite, please refer to the project documentation or contact the development team.