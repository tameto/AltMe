import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../error-boundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>Child content</Text>;
};

// Suppress console.error noise from React and ErrorBoundary during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('renders fallback UI when an error occurs', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('エラーが発生しました')).toBeTruthy();
    expect(getByText('Test error message')).toBeTruthy();
    expect(queryByText('Child content')).toBeNull();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <Text>Custom fallback</Text>;

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Custom fallback')).toBeTruthy();
    expect(queryByText('エラーが発生しました')).toBeNull();
  });

  it('resets error state when retry button is pressed', () => {
    let shouldThrow = true;
    const ToggleComponent = () => {
      if (shouldThrow) {
        throw new Error('Recoverable error');
      }
      return <Text>Recovered content</Text>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ToggleComponent />
      </ErrorBoundary>,
    );

    expect(getByText('エラーが発生しました')).toBeTruthy();

    // Fix the error before retrying
    shouldThrow = false;
    fireEvent.press(getByText('再試行'));

    expect(getByText('Recovered content')).toBeTruthy();
  });

  it('calls console.error via componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});
