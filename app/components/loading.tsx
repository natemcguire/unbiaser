export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping [animation-delay:0.2s]" />
      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping [animation-delay:0.4s]" />
    </div>
  );
} 