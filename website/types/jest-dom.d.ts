/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import type * as jestDom from '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R, T = {}> extends jestDom.TestingLibraryMatchers<void, HTMLElement> {
      // Explicit overrides for commonly used matchers to ensure proper typing
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