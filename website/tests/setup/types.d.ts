/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Import the Jest DOM matchers to extend Jest's expect function
import '@testing-library/jest-dom';

// Declare the custom matchers globally for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      // @testing-library/jest-dom matchers
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveFocus(): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toBePartiallyChecked(): R;
    }
  }

  namespace NodeJS {
    interface Global {
      // Declare any global variables that might be needed for tests
    }
  }
}

// Re-export to ensure this module is treated as a module
export {};