import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return null // Or a loading component
  }

  // Redirect to main app if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}