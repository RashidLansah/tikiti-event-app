import PlaygroundPage from '@/components/PlaygroundPage';
import PlatformStats from '@/components/home/PlatformStats';

export default function Home() {
  return <PlaygroundPage stats={<PlatformStats />} />;
}
