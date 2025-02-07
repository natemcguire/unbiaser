async function analyzeArticle() {
  try {
    // Create and show loading overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    `;

    const message = document.createElement('div');
    message.textContent = 'Starting analysis...';
    message.style.marginBottom = '15px';
    
    const button = document.createElement('a');
    button.textContent = 'View Analysis';
    button.style.cssText = `
      display: none;
      background: #0ea5e9;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
    `;

    content.appendChild(message);
    content.appendChild(button);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Get HTML content
    const html = document.documentElement.outerHTML;

    // Send to backend
    const response = await fetch('http://localhost:3000/api/analyze/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: window.location.href,
        title: document.title,
        html: html
      })
    });

    const { jobId } = await response.json();
    
    // After 500ms, update UI
    setTimeout(() => {
      message.style.display = 'none';
      button.style.display = 'inline-block';
      button.href = `http://localhost:3000/report/${jobId}`;
      button.target = '_blank';
    }, 500);

    // Add click handler to remove overlay
    button.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

  } catch (error) {
    console.error('Failed to analyze article:', error);
  }
} 