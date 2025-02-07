function findArticleContent() {
  // Priority list of selectors
  const selectors = [
    'article',
    '[role="article"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    'main',
    '#main-content'
  ];

  // Try each selector
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  // Fallback: Try to find the largest text block
  const paragraphs = Array.from(document.getElementsByTagName('p'));
  if (paragraphs.length > 0) {
    const parent = paragraphs.reduce((acc, p) => {
      const parent = p.parentElement;
      acc.set(parent, (acc.get(parent) || 0) + 1);
      return acc;
    }, new Map());

    const [bestParent] = Array.from(parent.entries())
      .sort(([,a], [,b]) => b - a)[0];

    return bestParent;
  }

  return document.body;
}

// Make it available to popup.js
window.findArticleContent = findArticleContent;

// Function to get page dimensions
function getPageDimensions() {
  const body = document.body;
  const html = document.documentElement;

  return {
    height: Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    ),
    width: Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    )
  };
}

// Function to find print version URL
function findPrintUrl() {
  // Common print URL patterns
  const printSelectors = [
    'link[rel="alternate"][media="print"]',
    'link[rel="canonical"][media="print"]',
    'a[href*="print"]',
    'a[href*="printable"]',
    'a[href*="/print/"]',
    'a[href*="printer-friendly"]'
  ];

  // Check meta tags and links first
  for (const selector of printSelectors) {
    const element = document.querySelector(selector);
    if (element?.href) return element.href;
  }

  // Common print URL patterns to try
  const url = window.location.href;
  const printUrls = [
    url.replace(/(\?.*)?$/, '?print=true'),
    url.replace(/(\?.*)?$/, '?print=1'),
    url.replace(/(\?.*)?$/, '/print'),
    url.replace(/(\?.*)?$/, '/printer-friendly'),
    url + '/print',
    url.replace(/\.html/, '.print.html')
  ];

  return printUrls[0]; // Start with first pattern
}

// Function to clean the page content
function cleanPageContent() {
  // Clone the document to avoid modifying the original
  const clone = document.cloneNode(true);
  
  // Remove noise elements
  const noiseSelectors = [
    '#comments', '.comments', '.comment-section', '#disqus_thread',
    '.social-share', '.share-buttons', '.social-media',
    '.advertisement', '.ad-container', '.promoted-content',
    '.newsletter-signup', '.subscription-prompt',
    'script', 'style', 'noscript', 'iframe', 'video',
    '.related-articles', '.recommended', '.more-stories',
    'aside', '.sidebar', '.widget-area',
    'footer', '.footer', '.bottom-content'
  ];

  noiseSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Find the main article content
  const article = clone.querySelector('article, [role="article"], .article-content, .post-content, main');
  
  if (article) {
    // Return just the article HTML
    return article.outerHTML;
  }

  // Fallback: Return cleaned body content
  return clone.querySelector('body').innerHTML;
}

// Function to capture page content and screenshot
async function captureFullPage() {
  try {
    // Clean the page first
    const noiseSelectors = [
      '#comments', '.comments', '.comment-section', '#disqus_thread',
      '.social-share', '.share-buttons', '.social-media',
      '.advertisement', '.ad-container', '.promoted-content',
      '.newsletter-signup', '.subscription-prompt'
    ];

    noiseSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get HTML content
    const content = cleanPageContent();

    // Take screenshot using chrome API
    const screenshot = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.dataUrl);
        }
      });
    });

    return { 
      content,
      screenshot
    };

  } catch (error) {
    console.error('Capture failed:', error);
    throw error;
  }
}

// Listen for capture request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'CAPTURE_FULL_PAGE') {
    console.log('Capturing page content...');
    
    captureFullPage()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Capture failed:', error);
        sendResponse({ error: error.message });
      });
      
    return true; // Keep channel open for async response
  }
});

// Log that content script is loaded
console.log('Content script loaded and ready for screenshots');

async function analyzeArticle() {
  try {
    // Check if analysis exists first
    const checkResponse = await fetch('http://localhost:3000/api/analyze/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: window.location.href })
    });
    
    const { exists, jobId } = await checkResponse.json();
    
    if (exists) {
      showOverlay(jobId, true);
      return;
    }

    // Queue new analysis and show overlay immediately with jobId
    const response = await fetch('http://localhost:3000/api/analyze/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.location.href,
        title: document.title,
        html: document.documentElement.outerHTML
      })
    });

    const { jobId: newJobId } = await response.json();
    
    // Show overlay immediately after getting jobId
    showOverlay(newJobId, false);

  } catch (error) {
    console.error('Failed to analyze article:', error);
    showOverlay(null, false, 'Server Offline');
  }
}

function showOverlay(jobId, existing = false, errorMessage = null) {
  // Remove any existing overlay first
  const existingOverlay = document.getElementById('political-compass-overlay');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }

  const overlay = document.createElement('div');
  overlay.id = 'political-compass-overlay';
  
  // Add a version/timestamp to force style refresh
  const styleVersion = Date.now();
  
  const styles = {
    overlay: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(44, 54, 63, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
    `,
    content: `
      background: #f5f5f0;
      padding: 24px;
      border-radius: 0;
      text-align: center;
      font-family: Georgia, serif;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(44, 54, 63, 0.2);
      min-width: 300px;
    `,
    title: `
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #2c363f;
      border-bottom: 2px double #2c363f;
      padding-bottom: 8px;
    `,
    message: `
      margin-bottom: 20px;
      font-size: 16px;
      color: #2c363f;
      font-style: italic;
    `,
    button: `
      display: inline-block;
      background: #2c363f;
      color: #f5f5f0;
      padding: 12px 24px;
      border-radius: 0;
      text-decoration: none;
      font-weight: 500;
      font-family: Georgia, serif;
      transition: all 0.2s;
      border: 1px solid #2c363f;
      cursor: ${jobId ? 'pointer' : 'default'};
      opacity: ${jobId ? '1' : '0.5'};
    `
  };

  // Apply styles with version
  overlay.style.cssText = styles.overlay + `/* v${styleVersion} */`;
  
  const content = document.createElement('div');
  content.style.cssText = styles.content + `/* v${styleVersion} */`;

  const title = document.createElement('div');
  title.textContent = 'Political Compass';
  title.style.cssText = styles.title + `/* v${styleVersion} */`;

  const message = document.createElement('div');
  if (errorMessage) {
    message.textContent = errorMessage;
    message.style.color = '#b91c1c';
  } else {
    message.textContent = existing ? 'Analysis Available' : 'Analysis in Progress';
  }
  message.style.cssText = styles.message + `/* v${styleVersion} */`;
  
  const button = document.createElement('a');
  if (errorMessage) {
    button.textContent = 'Try Again Later';
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
  } else {
    button.textContent = 'View Analysis →';
    button.href = `http://localhost:3000/report/${jobId}`;
    button.target = '_blank';
  }
  button.style.cssText = styles.button + `/* v${styleVersion} */`;

  // Add hover effects
  button.addEventListener('mouseover', () => {
    button.style.cssText = styles.button + `
      background: #f5f5f0;
      color: #2c363f;
      /* v${styleVersion} */
    `;
  });
  
  button.addEventListener('mouseout', () => {
    button.style.cssText = styles.button + `/* v${styleVersion} */`;
  });

  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(button);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Add click handler to remove overlay
  button.addEventListener('click', () => {
    if (jobId) {
      document.body.removeChild(overlay);
    }
  });

  return { message, button };
} 