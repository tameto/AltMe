import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { CosmicBackground } from '../cosmic-background';

const flattenStyle = (style: unknown) => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean));
  }
  return style ?? {};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findNodeWithStyle = (node: any, predicate: (s: any) => boolean): any => {
  if (!node) return null;
  const s = flattenStyle(node.props?.style);
  if (predicate(s)) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object') {
        const found = findNodeWithStyle(child, predicate);
        if (found) return found;
      }
    }
  }
  return null;
};

describe('CosmicBackground', () => {
  it('renders children', () => {
    const { getByText } = render(
      <CosmicBackground>
        <Text>Hello World</Text>
      </CosmicBackground>,
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies overlay opacity', () => {
    const { toJSON } = render(
      <CosmicBackground overlayOpacity={0.5}>
        <Text>Content</Text>
      </CosmicBackground>,
    );

    const tree = toJSON();
    const overlay = findNodeWithStyle(
      tree,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s?.opacity === 0.5,
    );
    expect(overlay).not.toBeNull();
  });

  it('merges custom style', () => {
    const { toJSON } = render(
      <CosmicBackground style={{ paddingTop: 100 }}>
        <Text>Styled</Text>
      </CosmicBackground>,
    );

    const tree = toJSON();
    const s = flattenStyle(tree?.props?.style);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any)?.paddingTop).toBe(100);
  });
});
