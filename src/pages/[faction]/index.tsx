import { useRouter } from 'next/router';
import FleetBuilder from '../../components/FleetBuilder';

export default function FactionPage() {
  const router = useRouter();
  const { faction } = router.query;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <FleetBuilder faction={faction as string} />
    </div>
  );
}