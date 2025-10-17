function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  status.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => status.style.display = 'none', 3000);
  }
}

function disableButtons(disabled) {
  document.querySelectorAll('button').forEach(btn => btn.disabled = disabled);
}

async function exportConversation(format) {
  try {
    disableButtons(true);
    showStatus(`Exporting as ${format.toUpperCase()}...`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com')) {
      showStatus('Please open a ChatGPT conversation', 'error');
      disableButtons(false);
      return;
    }
    
    const darkTheme = document.getElementById('darkTheme').checked;
    
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'export', format, darkTheme },
      (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.success) {
          showStatus('✓ Exported successfully!', 'success');
        } else {
          showStatus(response?.error || 'Export failed', 'error');
        }
        disableButtons(false);
      }
    );
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    disableButtons(false);
  }
}

document.getElementById('exportHtml').addEventListener('click', () => exportConversation('html'));
document.getElementById('exportMarkdown').addEventListener('click', () => exportConversation('markdown'));
document.getElementById('exportJson').addEventListener('click', () => exportConversation('json'));
document.getElementById('openSettings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});