import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { FullScreenLayout } from '@/layouts/FullScreenLayout'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute'
import { SplashPage } from '@/pages/SplashPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HomePage } from '@/pages/HomePage'
import { RoomPage } from '@/pages/RoomPage'
import { MyRoomPage } from '@/pages/MyRoomPage'
import { ProfilePage } from '@/pages/ProfilePage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/', element: <SplashPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/onboarding', element: <OnboardingPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/my-room', element: <MyRoomPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      {
        element: <FullScreenLayout />,
        children: [{ path: '/room/:id', element: <RoomPage /> }],
      },
    ],
  },
])
