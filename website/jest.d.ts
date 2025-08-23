/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Import the jest-dom matchers to extend Jest's expect
import '@testing-library/jest-dom';

// Ensure the jest-dom matchers are properly typed at the root level
declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      // @testing-library/jest-dom matchers
      toBeInTheDocument(): R;
      toHaveAttribute(name: string, expectedValue?: string | RegExp | boolean | number): R;
      toHaveClass(...expectedClasses: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(expectedStyles: string | Record<string, any>): R;
      toHaveTextContent(expectedTextContent: string | RegExp): R;
      toHaveValue(expectedValue: string | number | string[]): R;
      toHaveDisplayValue(expectedValue: string | RegExp | Array<string | RegExp>): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmptyDOMElement(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeVisible(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(expectedHTML: string): R;
      toHaveAccessibleDescription(expectedDescription?: string | RegExp): R;
      toHaveAccessibleName(expectedName?: string | RegExp): R;
      toHaveDescription(expectedDescription?: string | RegExp): R;
      toHaveErrorMessage(expectedErrorMessage?: string | RegExp): R;
    }
  }
}

export {};