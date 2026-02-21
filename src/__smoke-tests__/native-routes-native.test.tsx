/**
 * M013: Native (iOS/Android) スモークテスト
 * 全 app/ 画面が Native プリセットでクラッシュせずレンダリングされることを検証する。
 */
import './smoke-setup';

import React from 'react';
import { render } from '@testing-library/react-native';

// --- Layout components ---
import RootLayout from '@/app/_layout';
import AuthLayout from '@/app/(auth)/_layout';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import PaywallLayout from '@/app/(paywall)/_layout';
import TabsLayout from '@/app/(tabs)/_layout';

// --- Auth screens ---
import LoginScreen from '@/app/(auth)/login';

// --- Onboarding screens ---
import WelcomeScreen from '@/app/(onboarding)/welcome';
import PersonalityQuizScreen from '@/app/(onboarding)/personality-quiz';
import ChooseToneScreen from '@/app/(onboarding)/choose-tone';
import ChooseAvatarScreen from '@/app/(onboarding)/choose-avatar';
import MeetTwinScreen from '@/app/(onboarding)/meet-twin';
import ResultScreen from '@/app/(onboarding)/result';

// --- Tab screens ---
import ChatScreen from '@/app/(tabs)/index';
import TwinScreen from '@/app/(tabs)/twin';
import SettingsScreen from '@/app/(tabs)/settings';
import CommunityScreen from '@/app/(tabs)/community';

// --- Paywall ---
import PaywallScreen from '@/app/(paywall)/index';

// --- Modal screens ---
import SubscriptionManageScreen from '@/app/subscription-manage';
import AccountDeleteConfirmScreen from '@/app/account-delete-confirm';
import TokenPurchaseScreen from '@/app/token-purchase';
import MbtiSelectScreen from '@/app/mbti-select';
import TwinConversationDetailScreen from '@/app/twin-conversation-detail';
import NotificationSettingsScreen from '@/app/notification-settings';
import CommunityCreateScreen from '@/app/community-create';
import CommunityDetailScreen from '@/app/community/[id]';
import NotFoundScreen from '@/app/+not-found';

const screens = [
  { name: 'RootLayout', Component: RootLayout },
  { name: 'AuthLayout', Component: AuthLayout },
  { name: 'OnboardingLayout', Component: OnboardingLayout },
  { name: 'PaywallLayout', Component: PaywallLayout },
  { name: 'TabsLayout', Component: TabsLayout },
  { name: 'LoginScreen', Component: LoginScreen },
  { name: 'WelcomeScreen', Component: WelcomeScreen },
  { name: 'PersonalityQuizScreen', Component: PersonalityQuizScreen },
  { name: 'ChooseToneScreen', Component: ChooseToneScreen },
  { name: 'ChooseAvatarScreen', Component: ChooseAvatarScreen },
  { name: 'MeetTwinScreen', Component: MeetTwinScreen },
  { name: 'ResultScreen', Component: ResultScreen },
  { name: 'ChatScreen', Component: ChatScreen },
  { name: 'TwinScreen', Component: TwinScreen },
  { name: 'SettingsScreen', Component: SettingsScreen },
  { name: 'CommunityScreen', Component: CommunityScreen },
  { name: 'PaywallScreen', Component: PaywallScreen },
  { name: 'SubscriptionManageScreen', Component: SubscriptionManageScreen },
  { name: 'AccountDeleteConfirmScreen', Component: AccountDeleteConfirmScreen },
  { name: 'TokenPurchaseScreen', Component: TokenPurchaseScreen },
  { name: 'MbtiSelectScreen', Component: MbtiSelectScreen },
  { name: 'TwinConversationDetailScreen', Component: TwinConversationDetailScreen },
  { name: 'NotificationSettingsScreen', Component: NotificationSettingsScreen },
  { name: 'CommunityCreateScreen', Component: CommunityCreateScreen },
  { name: 'CommunityDetailScreen', Component: CommunityDetailScreen },
  { name: 'NotFoundScreen', Component: NotFoundScreen },
];

describe('Native Smoke Tests — all screens render without crashing', () => {
  it.each(screens)('renders $name without crashing on native', ({ Component }) => {
    expect(() => {
      const { unmount } = render(<Component />);
      unmount();
    }).not.toThrow();
  });
});
