chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-selection',
    title: 'Analyze selected text',
    contexts: ['selection']
  });
});

// Update these URLs to use environment variable or current domain
const API_URL = 'https://c096da6f702a.ngrok.app'; // Your current ngrok URL

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-selection') {
    fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: info.selectionText,
        url: tab.url,
        title: tab.title
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      chrome.tabs.create({ url: data.trackingUrl });
    })
    .catch(error => {
      console.error('Analysis failed:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Analysis Failed',
        message: error.message
      });
    });
  }
});

// Track active jobs
const activeJobs = new Map();

// Listen for job watch requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WATCH_JOB') {
    const { jobId, metadata } = message;
    watchJob(jobId, metadata);
    sendResponse({ success: true });
  }
});

async function watchJob(jobId, metadata) {
  // Add to active jobs
  activeJobs.set(jobId, metadata);

  // Start polling
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/api/analyze/status/${jobId}`);
      const data = await response.json();

      if (data.status === 'completed' || data.status === 'failed') {
        // Show notification
        chrome.notifications.create(`job-${jobId}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: data.status === 'completed' ? 'Analysis Complete' : 'Analysis Failed',
          message: data.status === 'completed' 
            ? `Analysis for "${metadata.title}" is ready!`
            : `Failed to analyze "${metadata.title}". Please try again.`,
          buttons: data.status === 'completed' ? [{ title: 'View Analysis' }] : []
        });

        // Clean up storage
        chrome.storage.local.get(['activeJobs'], (result) => {
          const activeJobs = result.activeJobs || {};
          Object.keys(activeJobs).forEach(url => {
            activeJobs[url] = activeJobs[url].filter(job => job.jobId !== jobId);
            if (activeJobs[url].length === 0) {
              delete activeJobs[url];
            }
          });
          chrome.storage.local.set({ activeJobs });
        });

        // Clean up
        clearInterval(pollInterval);
        activeJobs.delete(jobId);
      }
    } catch (error) {
      console.error('Job status check failed:', error);
    }
  }, 5000);
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('job-')) {
    const jobId = notificationId.replace('job-', '');
    chrome.tabs.create({ url: `https://c096da6f702a.ngrok.app/report/${jobId}` });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_VISIBLE_TAB') {
    chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 95}, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Screenshot failed:', chrome.runtime.lastError);
        sendResponse({error: chrome.runtime.lastError.message});
      } else {
        sendResponse({dataUrl});
      }
    });
    return true; // Required to use sendResponse asynchronously
  }
}); 