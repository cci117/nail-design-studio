export function LibraryLoading() {
  return <div className="animate-pulse"><div className="h-8 w-32 rounded bg-zinc-900"/><div className="mt-3 h-4 w-56 rounded bg-zinc-900"/><div className="mt-8 flex gap-3"><div className="h-11 flex-1 rounded-xl bg-zinc-900"/><div className="h-11 w-24 rounded-xl bg-zinc-900"/></div><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/5] rounded-2xl bg-zinc-900"/>)}</div></div>;
}
