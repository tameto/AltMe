import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { useUser } from '@/src/shared/hooks/use-user';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import type { UserProfile } from '@/src/shared/types/user';
import type { EntitlementInfo } from '@/src/shared/types/subscription';

type ProviderOptions = {
  user?: UserProfile | null;
  entitlement?: Partial<EntitlementInfo>;
};

/**
 * Render a component with Zustand stores pre-populated.
 * Zustand stores are global singletons, so we set state directly.
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: ProviderOptions & Omit<RenderOptions, 'wrapper'>,
) => {
  const { user, entitlement, ...renderOptions } = options ?? {};

  // Pre-populate user store
  if (user !== undefined) {
    useUser.setState({ user, isLoading: false });
  }

  // Pre-populate subscription store
  if (entitlement) {
    useSubscription.setState({
      entitlement: {
        isPro: false,
        isTrialing: false,
        status: 'free',
        planType: 'free',
        expiresAt: null,
        trialDaysRemaining: null,
        ...entitlement,
      },
      isLoading: false,
    });
  }

  return render(ui, renderOptions);
};
