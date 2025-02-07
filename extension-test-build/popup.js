const API_URL = 'https://c096da6f702a.ngrok.app'; // Your ngrok URL

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('analyze');
  const status = document.getElementById('status');

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = 'Capturing content...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Inject content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Wait for script to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture page content
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'CAPTURE_FULL_PAGE' 
      });

      if (response.error) {
        throw new Error(response.error);
      }

      status.textContent = 'Starting analysis...';

      const analysisResponse = await fetch(`${API_URL}/api/analyze/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: tab.url,
          title: tab.title,
          html: response.content,
          screenshot_data: response.screenshot
        })
      });

      const data = await analysisResponse.json();
      
      if (!analysisResponse.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      showStatus(data.jobId);

    } catch (error) {
      console.error('Analysis failed:', error);
      status.textContent = `Error: ${error.message}`;
      status.classList.add('error');
    } finally {
      button.disabled = false;
    }
  });
});

function showStatus(jobId) {
  const status = document.getElementById('status');
  status.innerHTML = `
    <div class="status-links">
      <a href="${API_URL}/report/${jobId}" target="_blank" class="status-link">
        View Analysis
      </a>
    </div>
  `;
} 