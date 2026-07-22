// Rotte tipizzate: niente stringhe magiche sparse nel codice.
export const PATHS = {
  splash: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  home: '/home',
  room: (id = ':id') => `/room/${id}`,
  myRoom: '/my-room',
  profile: '/profile',
} as const
