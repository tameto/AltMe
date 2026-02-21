import { Platform } from 'react-native';

Object.defineProperty(Platform, 'OS', { value: 'web', writable: true, configurable: true });

import React from 'react';
import { render } from '@testing-library/react-native';
import { WebHead } from '../web-head';

describe('WebHead', () => {
  afterEach(() => {
    document.title = '';
    document.querySelector('meta[name="theme-color"]')?.remove();
    document.querySelector('link[rel="icon"]')?.remove();
  });

  it('sets document title', () => {
    render(<WebHead title="AltMe - Chat" />);
    expect(document.title).toBe('AltMe - Chat');
  });

  it('sets theme-color meta tag', () => {
    render(<WebHead themeColor="#0F172A" />);
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta?.content).toBe('#0F172A');
  });

  it('sets favicon link', () => {
    render(<WebHead faviconUrl="/favicon.ico" />);
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(link?.href).toContain('/favicon.ico');
  });
});
