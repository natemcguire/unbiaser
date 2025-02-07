export function NewspaperTemplate({
  headline,
  content,
  sources,
  date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}) {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-[#FFF1E5] min-h-screen font-serif">
      <header className="text-center mb-12 border-b-2 border-black pb-4">
        <div className="text-4xl font-bold mb-2 font-[georgia]">The Alternative View</div>
        <div className="text-sm uppercase tracking-widest">{date}</div>
      </header>

      <article>
        <h1 className="text-3xl font-bold mb-6 font-[georgia] leading-tight">
          {headline}
        </h1>

        <div className="prose prose-slate max-w-none">
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {sources.length > 0 && (
          <div className="mt-12 pt-4 border-t border-gray-300">
            <h2 className="text-lg font-semibold mb-2">Sources:</h2>
            <ul className="text-sm space-y-1 text-gray-600">
              {sources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>
        )}
      </article>

      <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
        <p>This is an AI-generated alternative perspective article.</p>
        <p>Generated to provide contrasting viewpoints on news topics.</p>
      </footer>
    </div>
  );
} 