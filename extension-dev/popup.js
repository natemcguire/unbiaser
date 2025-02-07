const API_URL = 'https://mid-iqhuy6n8l-nate-mcguires-projects.vercel.app'; // Vercel URL

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
        headers: { 
          'Content-Type': 'application/json',
          'Origin': chrome.runtime.getURL('')
        },
        body: JSON.stringify({
          url: tab.url,
          title: tab.title,
          html: response.content,
          screenshot_data: response.screenshot
        })
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || `Server error: ${analysisResponse.status}`);
      }

      const data = await analysisResponse.json();
      saveState(data.jobId);
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

// Add state persistence
function saveState(jobId) {
  chrome.storage.local.set({ 
    lastAnalysis: {
      jobId,
      url: window.location.href,
      timestamp: Date.now()
    }
  });
}

// Check for interrupted analysis on popup open
async function checkInterruptedAnalysis() {
  try {
    const { lastAnalysis } = await chrome.storage.local.get('lastAnalysis');
    
    if (lastAnalysis && lastAnalysis.url === window.location.href) {
      // If analysis was started in last 5 minutes
      if (Date.now() - lastAnalysis.timestamp < 5 * 60 * 1000) {
        showStatus(lastAnalysis.jobId);
      }
    }
  } catch (error) {
    console.error('Failed to check analysis state:', error);
  }
}

// Call on popup open
checkInterruptedAnalysis(); 