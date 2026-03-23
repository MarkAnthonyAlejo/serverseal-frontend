import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <div className="text-center">
        <p className="font-mono text-xs text-status-danger tracking-widest mb-4">
          [!] SYSTEM_ERROR
        </p>
        <h1 className="font-display text-8xl text-text-primary tracking-tighter leading-none">
          ERR_ROUTE_NOT_FOUND
        </h1>
        <p className="font-mono text-sm text-text-muted mt-4">
          The requested manifest path does not exist in this system.
        </p>
      </div>
      <Link
        to="/"
        className="font-mono text-xs text-accent-primary border border-accent-primary px-6 py-3 hover:bg-accent-primary hover:text-base transition-colors tracking-widest uppercase"
      >
        &gt; RETURN_TO_DASHBOARD
      </Link>
    </div>
  );
}
