export function SyncIndicator({ running }: { running: boolean }) {
  if (!running) return null;
  return (
    <span className="sync-dot" title="Sincronizando" aria-live="polite">
      <span className="sr-only">Sincronizando</span>
    </span>
  );
}
