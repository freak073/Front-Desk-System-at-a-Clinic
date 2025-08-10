// Suppress ReactDOMTestUtils.act deprecation warnings at the React DOM level
jest.mock('react-dom/test-utils', () => {
  const originalTestUtils = jest.requireActual('react-dom/test-utils');
  
  // Override act to use React.act directly
  const react = jest.requireActual('react');
  return {
    ...originalTestUtils,
    act: react.act || originalTestUtils.act
  };
});

import '@testing-library/jest-dom';