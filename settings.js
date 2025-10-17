// Settings page script

const DEFAULTS = {
  light: {
    headingBG: '#fff685',
    userBG: '#ffd6e7',
    assistantBG: '#ffffff',
    metaGray: '#555555',
    linkBlue: '#1a5fff'
  },
  dark: {
    headingBG: '#fff685',
    userBG: '#fbc6e0',
    assistantBG: '#2a2a2a',
    metaGray: '#bbbbbb',
    linkBlue: '#eb0f5c'
  },
  options: {
    fontFamily: 'system-ui',
    fontSize: 14,
    showTimestamps: false,
    customCSS: ''
  }
};

// Load saved colors
chrome.storage.sync.get(['lightColors', 'darkColors'], (result) => {
  const lightColors = result.lightColors || DEFAULTS.light;
  const darkColors = result.darkColors || DEFAULTS.dark;
  
  // Load light theme colors
  for (const key in lightColors) {
    const colorInput = document.getElementById('light-' + key);
    const textInput = document.getElementById('light-' + key + '-text');
    
    if (colorInput && textInput) {
      colorInput.value = lightColors[key];
      textInput.value = lightColors[key];
    }
  }
  
  // Load dark theme colors
  for (const key in darkColors) {
    const colorInput = document.getElementById('dark-' + key);
    const textInput = document.getElementById('dark-' + key + '-text');
    
    if (colorInput && textInput) {
      colorInput.value = darkColors[key];
      textInput.value = darkColors[key];
    }
  }
});

// Load options
chrome.storage.sync.get(['options'], (result) => {
  const options = result.options || {
    fontFamily: 'system-ui',
    fontSize: 14,
    showTimestamps: false,
    customCSS: ''
  };
  
  document.getElementById('fontFamily').value = options.fontFamily;
  document.getElementById('fontSize').value = options.fontSize;
  document.getElementById('fontSizeValue').textContent = options.fontSize + 'px';
  document.getElementById('showTimestamps').checked = options.showTimestamps;
  document.getElementById('customCSS').value = options.customCSS || '';
});

// Sync color pickers with text inputs
['light', 'dark'].forEach(theme => {
  Object.keys(DEFAULTS.light).forEach(key => {
    const colorInput = document.getElementById(`${theme}-${key}`);
    const textInput = document.getElementById(`${theme}-${key}-text`);
    
    colorInput.addEventListener('input', (e) => {
      textInput.value = e.target.value;
    });
    
    textInput.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        colorInput.value = e.target.value;
      }
    });
  });
});

// Font size slider
document.getElementById('fontSize').addEventListener('input', (e) => {
  document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const lightColors = {};
  const darkColors = {};
  
  for (const key in DEFAULTS.light) {
    lightColors[key] = document.getElementById('light-' + key + '-text').value;
  }
  
  for (const key in DEFAULTS.dark) {
    darkColors[key] = document.getElementById('dark-' + key + '-text').value;
  }
  
  const options = {
    fontFamily: document.getElementById('fontFamily').value,
    fontSize: parseInt(document.getElementById('fontSize').value),
    showTimestamps: document.getElementById('showTimestamps').checked,
    customCSS: document.getElementById('customCSS').value
  };
  
  chrome.storage.sync.set({ lightColors, darkColors, options }, () => {
    showStatus('Settings saved successfully!');
  });
});

// Reset to defaults
document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.set({ 
    lightColors: DEFAULTS.light,
    darkColors: DEFAULTS.dark,
    options: DEFAULTS.options
  }, () => {
    // Reset colors...
    for (const key in DEFAULTS.light) {
      document.getElementById('light-' + key).value = DEFAULTS.light[key];
      document.getElementById('light-' + key + '-text').value = DEFAULTS.light[key];
    }
    
    for (const key in DEFAULTS.dark) {
      document.getElementById('dark-' + key).value = DEFAULTS.dark[key];
      document.getElementById('dark-' + key + '-text').value = DEFAULTS.dark[key];
    }
    
    // Reset options
    document.getElementById('fontFamily').value = DEFAULTS.options.fontFamily;
    document.getElementById('fontSize').value = DEFAULTS.options.fontSize;
    document.getElementById('fontSizeValue').textContent = DEFAULTS.options.fontSize + 'px';
    document.getElementById('showTimestamps').checked = DEFAULTS.options.showTimestamps;
    document.getElementById('customCSS').value = DEFAULTS.options.customCSS;
    
    showStatus('Reset to default colors!');
  });
});

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status success';
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}