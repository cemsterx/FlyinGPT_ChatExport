// Content script - simple, proven approach
console.log('ExportGPT loaded');

let LIGHT_COLORS = {
  headingBG: '#fff685',
  userBG: '#ffd6e7',
  assistantBG: '#ffffff',
  metaGray: '#555555',
  linkBlue: '#1a5fff'
};

let DARK_COLORS = {
  headingBG: '#4a4a2a',
  userBG: '#fbc6e0',
  assistantBG: '#2a2a2a',
  metaGray: '#bbbbbb',
  linkBlue: '#6b9eff'
};

let OPTIONS = {
  fontFamily: 'system-ui',
  fontSize: 14,
  showTimestamps: false,
  customCSS: ''
};

chrome.storage.sync.get(['lightColors', 'darkColors', 'options'], (result) => {
  if (result.lightColors) LIGHT_COLORS = { ...LIGHT_COLORS, ...result.lightColors };
  if (result.darkColors) DARK_COLORS = { ...DARK_COLORS, ...result.darkColors };
  if (result.options) OPTIONS = { ...OPTIONS, ...result.options };
});

const pad = n => n < 10 ? '0' + n : '' + n;
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function getTitle() {
  return (document.title || 'ChatGPT').replace(/\s*[-–|]\s*ChatGPT.*$/i, '').trim() || 'ChatGPT';
}

function extractMessages() {
  const messages = [...document.querySelectorAll('[data-message-author-role]')];
  
  if (!messages.length) {
    throw new Error('No messages found');
  }
  
  return messages.map(msg => {
    const role = msg.getAttribute('data-message-author-role');
    const isUser = role === 'user';
    
    // Extract timestamp from ChatGPT
    const timeEl = msg.querySelector('time');
    const timestamp = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent || '') : '';
    
    const content = msg.cloneNode(true);
    
    content.querySelectorAll('button, form, input, textarea').forEach(el => el.remove());
    content.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    content.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    
    return {
      role,
      isUser,
      timestamp,
      html: content.innerHTML,
      text: content.textContent.trim()
    };
  });
}

function exportHTML(messages, darkTheme) {
  const title = getTitle();
  const bg = darkTheme ? '#1a1a1a' : '#fff';
  const text = darkTheme ? '#e0e0e0' : '#111';
  const colors = darkTheme ? DARK_COLORS : LIGHT_COLORS;
  const userBg = colors.userBG;
  const headingBg = colors.headingBG;
  const assistantBg = colors.assistantBG;
  
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
body { background: ${bg}; color: ${text}; font: ${OPTIONS.fontSize}px ${OPTIONS.fontFamily}; margin: 24px; }
h1 { background: ${headingBg}; padding: 8px; border-radius: 8px; display: inline-block; color: ${darkTheme ? '#1a1a1a' : '#111'}; margin-bottom: 40px; }
.msg { margin: 18px 0; padding: 14px; border-radius: 12px; }
.msg:first-of-type { margin-top: 80px; }
.user { background: ${userBg}; max-width: 70%; float: left; clear: both; }
.user, .user * { color: ${darkTheme ? '#1a1a1a' : '#111'} !important; }
.assistant { background: ${assistantBg}; clear: both; }
.meta { font-size: 16px; margin-bottom: 8px; font-weight: bold; }
.user .meta { color: ${darkTheme ? '#333' : colors.metaGray}; }
.assistant .meta { color: ${darkTheme ? '#2d2d2d' : colors.metaGray}; background: ${headingBg}; padding: 4px 8px; border-radius: 4px; display: inline-block; }
pre { background: ${darkTheme ? '#3a3a3a' : '#f6f6f7'}; padding: 12px 12px 12px 12px; padding-top: 40px; border-radius: 8px; overflow-x: auto; color: ${text}; position: relative; }
.copy-btn { position: absolute; top: 8px; right: 8px; padding: 4px 8px; background: ${darkTheme ? '#444' : '#fff'}; color: ${darkTheme ? '#eee' : '#333'}; border: 1px solid ${darkTheme ? '#666' : '#ccc'}; border-radius: 4px; cursor: pointer; font-size: 12px; }
.copy-btn:hover { background: ${darkTheme ? '#555' : '#f0f0f0'}; }
code { font-family: monospace; color: ${text}; }
${OPTIONS.customCSS}
</style>
</head>
<body>
<h1>${esc(title)}</h1>
`;

  for (const msg of messages) {
    const timestamp = OPTIONS.showTimestamps && msg.timestamp ? `<span class="timestamp">[${esc(msg.timestamp)}]</span> ` : '';
    html += `<div class="msg ${msg.isUser ? 'user' : 'assistant'}">
<div class="meta">${timestamp}${esc(msg.role)}</div>
${msg.html}
</div>`;
  }
  
  html += `<script>
document.addEventListener('click', e => {
  if (!e.target.classList.contains('copy-btn')) return;
  const pre = e.target.parentElement;
  const code = pre.querySelector('code') || pre;
  const text = code.textContent;
  navigator.clipboard.writeText(text).then(() => {
    e.target.textContent = 'Copied!';
    setTimeout(() => e.target.textContent = 'Copy', 2000);
  });
});
document.querySelectorAll('pre').forEach(pre => {
  if (pre.querySelector('.copy-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'Copy';
  pre.insertBefore(btn, pre.firstChild);
});
</script></body></html>`;
  
  return html;
}

function exportMarkdown(messages) {
  const title = getTitle();
  let md = `# ${title}\n\n`;
  
  for (const msg of messages) {
    // Extract code blocks with language
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = msg.html;
    
    tempDiv.querySelectorAll('pre code').forEach(code => {
      const lang = code.className.match(/language-(\w+)/)?.[1] || '';
      const codeText = code.textContent;
      const pre = code.parentElement;
      pre.outerHTML = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
    });
    
    md += `## ${msg.role}\n\n${tempDiv.textContent}\n\n---\n\n`;
  }
  
  return md;
}

function exportJSON(messages) {
  return JSON.stringify({
    title: getTitle(),
    exported: new Date().toISOString(),
    messages: messages
  }, null, 2);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);  
}

function getFilename(format) {
  const title = getTitle().substring(0, 50);
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${title} _ ${date} ${time}.${format}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'export') return;
  
  try {
    const messages = extractMessages();
    const darkTheme = request.darkTheme || false;
    let content, type;
    
    if (request.format === 'html') {
      content = exportHTML(messages, darkTheme);
      type = 'text/html';
    } else if (request.format === 'markdown') {
      content = exportMarkdown(messages);
      type = 'text/markdown';
    } else if (request.format === 'json') {
      content = exportJSON(messages);
      type = 'application/json';
    }
    
    const filename = getFilename(request.format);
    download(content, filename, type);
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});