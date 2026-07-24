// Rotte tipizzate: niente stringhe magiche sparse nel codice.
export const PATHS = {
  splash: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  home: '/home',
  myRoom: '/my-room',
  room: (id = ':id') => `/room/${id}`,
  matches: '/matches',
  chat: (id = ':id') => `/chat/${id}`,
  profile: '/profile',
  settings: '/settings',
} as const
