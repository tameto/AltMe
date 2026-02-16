import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="personality-quiz" />
      <Stack.Screen name="result" />
      <Stack.Screen name="choose-avatar" />
      <Stack.Screen name="choose-tone" />
      <Stack.Screen name="meet-twin" />
    </Stack>
  );
}
