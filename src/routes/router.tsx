import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute'
import { OnboardingRoute } from '@/routes/guards/OnboardingRoute'
import { SplashPage } from '@/pages/SplashPage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HomePage } from '@/pages/HomePage'
import { RoomsPage } from '@/pages/RoomsPage'
import { RoomDetailPage } from '@/pages/RoomDetailPage'
import { MatchesPage } from '@/pages/MatchesPage'
import { ChatPage } from '@/pages/ChatPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/', element: <SplashPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <OnboardingPage /> },
        ],
      },
      {
        element: <OnboardingRoute />,
        children: [{ path: '/onboarding', element: <OnboardingPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/my-room', element: <RoomsPage /> },
          { path: '/room/:id', element: <RoomDetailPage /> },
          { path: '/matches', element: <MatchesPage /> },
          { path: '/chat/:id', element: <ChatPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
