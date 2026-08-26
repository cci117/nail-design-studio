export default function TagsLoading() {
  return <div className="animate-pulse space-y-5"><div className="h-8 w-32 rounded bg-zinc-900"/>{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 rounded-2xl bg-zinc-900"/>)}</div>;
}
