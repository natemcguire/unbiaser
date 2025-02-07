export default function TestPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#2c363f] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p>Job ID: {params.jobId}</p>
      </div>
    </div>
  );
} 