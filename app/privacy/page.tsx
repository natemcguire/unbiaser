export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose">
        <h2>Data Collection</h2>
        <p>We collect:</p>
        <ul>
          <li>Article content you choose to analyze</li>
          <li>Screenshots of analyzed pages</li>
          <li>Analysis results</li>
        </ul>

        <h2>Data Usage</h2>
        <p>Your data is used only for:</p>
        <ul>
          <li>Providing bias analysis</li>
          <li>Generating counterpoints</li>
          <li>Improving our service</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>We do not sell or share your data with third parties.</p>

        <h2>Data Retention</h2>
        <p>Analysis data is stored for 30 days.</p>

        <h2>Contact</h2>
        <p>Questions? Contact us at privacy@your-domain.com</p>
      </div>
    </div>
  );
} 