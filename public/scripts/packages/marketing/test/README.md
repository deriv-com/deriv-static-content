# Marketing Cookie Test Suite

This directory contains comprehensive tests for the marketing cookie functionality in `src/cookie.js`.

## Test Structure

### Core Test Files

- **`cookie.test.js`** - Main functionality tests covering all core features
- **`cookie-edge-cases.test.js`** - Edge cases and error handling scenarios
- **`cookie-performance.test.js`** - Performance and scalability tests

### Support Files

- **`setup.js`** - Test environment setup and global mocks
- **`utils.js`** - Test utilities and helper functions

## Test Categories

### 1. Basic Cookie Operations (`cookie.test.js`)
- Cookie initialization and default values
- UTM parameter handling
- Affiliate tracking functionality
- Device detection (mobile/desktop)
- Date handling and formatting
- GCLID and campaign channel processing

### 2. Edge Cases (`cookie-edge-cases.test.js`)
- Cookie storage limits and truncation
- Special character handling
- Domain configuration edge cases
- Race condition scenarios
- Browser compatibility issues
- Memory management
- Encoding/decoding edge cases

### 3. Performance Tests (`cookie-performance.test.js`)
- Execution time benchmarks
- Memory usage monitoring
- Large dataset handling
- Concurrent operation testing
- JSON parsing performance
- Logging efficiency

## Key Test Scenarios

### UTM Parameter Processing
```javascript
// Tests various UTM parameter combinations
setURLSearchParams({
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'test_campaign',
  fbclid: 'facebook_click_id'
});
```

### Affiliate Link Validation
```javascript
// Tests incomplete affiliate link detection
setURLSearchParams({
  utm_medium: 'affiliate' // Missing affiliate parameters
});
// Should trigger cookie cleanup
```

### Cookie Persistence
```javascript
// Tests that existing cookies are preserved
setCookieDirectly('signup_device', JSON.stringify({
  signup_device: 'mobile'
}));
// Should not be overwritten
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Core functionality
npm test cookie.test.js

# Edge cases
npm test cookie-edge-cases.test.js

# Performance tests
npm test cookie-performance.test.js
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Utilities

### URL Parameter Mocking
```javascript
import { setURLSearchParams } from './utils.js';

setURLSearchParams({
  utm_source: 'google',
  t: 'affiliate_token'
});
```

### Cookie Manipulation
```javascript
import { setCookieDirectly, getCookieValue, clearAllCookies } from './utils.js';

// Set a cookie directly
setCookieDirectly('test_cookie', 'test_value');

// Get cookie value
const value = getCookieValue('test_cookie');

// Clear all cookies
clearAllCookies();
```

### User Agent Mocking
```javascript
import { mockMobileUserAgent, mockDesktopUserAgent } from './utils.js';

mockMobileUserAgent(); // Sets mobile user agent
mockDesktopUserAgent(); // Sets desktop user agent
```

## Test Coverage Areas

### ✅ Functional Coverage
- [x] UTM parameter processing
- [x] Affiliate tracking logic
- [x] Cookie setting and getting
- [x] Device detection
- [x] Date formatting
- [x] Error handling
- [x] Logging functionality

### ✅ Edge Case Coverage
- [x] Malformed JSON handling
- [x] Special character processing
- [x] Long value truncation
- [x] Domain variations
- [x] Browser compatibility
- [x] Race conditions
- [x] Memory management

### ✅ Performance Coverage
- [x] Execution time limits
- [x] Memory usage monitoring
- [x] Large dataset handling
- [x] Concurrent operations
- [x] JSON parsing efficiency
- [x] Logging performance

## Expected Test Results

### Performance Benchmarks
- Basic execution: < 100ms
- Large datasets: < 200ms
- Cookie operations: < 50ms
- JSON parsing: < 20ms

### Coverage Targets
- Line coverage: > 95%
- Branch coverage: > 90%
- Function coverage: 100%

## Debugging Tests

### View Test Logs
```javascript
// Access marketing cookie logs in tests
console.log(window.marketingCookieLogs);
```

### Check Cookie State
```javascript
// View all cookies set during test
console.log(window.marketingCookies);
```

### Verify Cookie Values
```javascript
// Check actual cookie values
console.log(document.cookie);
```

## Common Test Patterns

### Testing Cookie Setting
```javascript
it('should set cookie correctly', () => {
  setURLSearchParams({ utm_source: 'test' });
  
  const result = window.getMarketingCookies();
  
  const cookieValue = getCookieValue('utm_data');
  expect(cookieValue).toBeTruthy();
  
  const parsed = JSON.parse(cookieValue);
  expect(parsed.utm_source).toBe('test');
});
```

### Testing Error Handling
```javascript
it('should handle errors gracefully', () => {
  setCookieDirectly('utm_data', 'invalid_json');
  
  const result = window.getMarketingCookies();
  
  expect(result).toBeDefined();
  expect(window.marketingCookieLogs.some(log => 
    log.details && log.details.error
  )).toBe(true);
});
```

### Testing Performance
```javascript
it('should execute within time limit', () => {
  const startTime = performance.now();
  const result = window.getMarketingCookies();
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100);
});
```

## Continuous Integration

The test suite is designed to run in CI/CD environments with:
- Headless browser support (happy-dom)
- Coverage reporting
- Performance monitoring
- Memory leak detection

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Use appropriate test utilities
3. Include both positive and negative test cases
4. Add performance tests for new features
5. Update this README if adding new test categories

## Troubleshooting

### Common Issues

**Tests failing due to timing issues:**
- Use `await` for async operations
- Add appropriate delays for DOM updates

**Cookie-related test failures:**
- Ensure `clearAllCookies()` is called in `beforeEach`
- Check that mocks are properly reset

**Performance test failures:**
- Adjust time limits based on CI environment
- Consider system load when setting benchmarks
