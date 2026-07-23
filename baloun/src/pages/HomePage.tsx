import { FeedContainer } from '@/features/feed/components/FeedContainer'

// La Home è solo il contenitore del feed: tutta la logica vive in features/feed.
export function HomePage() {
  return <FeedContainer />
}
