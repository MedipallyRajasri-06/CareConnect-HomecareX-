import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-4">
      <p className="font-display text-6xl font-semibold text-navy-900">404</p>
      <p className="text-sm text-muted mt-2 mb-6">This page doesn't exist or you don't have access to it.</p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
