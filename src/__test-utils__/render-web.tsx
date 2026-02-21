/**
 * Web-specific render utility for jsdom environment.
 * Re-exports @testing-library/react-native render, which works in jsdom
 * for react-native-web components.
 *
 * This module can be extended with web-specific providers (e.g. BrowserRouter)
 * as the web platform support grows.
 */
import { render, type RenderOptions } from '@testing-library/react-native';

export type WebRenderOptions = RenderOptions;

/**
 * Render a React component in the jsdom (web) test environment.
 */
export const renderWeb = (
  ui: React.ReactElement,
  options?: WebRenderOptions,
) => {
  return render(ui, options);
};
