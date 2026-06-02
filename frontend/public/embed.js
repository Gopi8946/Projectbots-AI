(function () {
  // Read configuration
  var config = window.ProjectBotsConfig || {};
  var apiKey = config.apiKey;

  if (!apiKey) {
    console.error('[ProjectBots.AI] Missing apiKey. Set window.ProjectBotsConfig = { apiKey: "your_key" }');
    return;
  }

  // Determine base URL from this script's location
  var scriptEl = document.currentScript;
  var baseUrl = scriptEl
    ? scriptEl.src.replace('/embed.js', '')
    : 'http://localhost:3000';

  var widgetUrl = baseUrl + '/widget/' + apiKey;
  var position = config.position || 'right';
  var bubbleColor = config.color || '#6366f1';

  // Inject CSS
  var style = document.createElement('style');
  style.textContent =
    '#pb-widget-bubble{' +
      'position:fixed;bottom:24px;' + position + ':24px;' +
      'width:60px;height:60px;border-radius:50%;' +
      'background:linear-gradient(135deg,' + bubbleColor + ',' + bubbleColor + 'dd);' +
      'cursor:pointer;z-index:99998;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.15);' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:transform 0.2s,box-shadow 0.2s;' +
    '}' +
    '#pb-widget-bubble:hover{transform:scale(1.08);box-shadow:0 6px 25px rgba(0,0,0,0.2);}' +
    '#pb-widget-bubble svg{width:28px;height:28px;fill:white;}' +
    '#pb-widget-iframe{' +
      'position:fixed;bottom:24px;' + position + ':24px;' +
      'width:380px;height:560px;' +
      'border:none;border-radius:16px;' +
      'box-shadow:0 10px 50px rgba(0,0,0,0.18);' +
      'z-index:99999;display:none;' +
      'overflow:hidden;' +
    '}' +
    '@media(max-width:480px){' +
      '#pb-widget-iframe{width:100%!important;height:100%!important;bottom:0!important;' +
      position + ':0!important;border-radius:0!important;}' +
    '}';
  document.head.appendChild(style);

  // Create chat bubble
  var bubble = document.createElement('div');
  bubble.id = 'pb-widget-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24">' +
    '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>' +
    '</svg>';

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'pb-widget-iframe';
  iframe.src = widgetUrl;
  iframe.title = 'Chat Widget';
  iframe.allow = 'microphone';

  // Toggle behavior
  var isOpen = false;

  bubble.addEventListener('click', function () {
    iframe.style.display = 'block';
    bubble.style.display = 'none';
    isOpen = true;
  });

  // Listen for close message from iframe
  window.addEventListener('message', function (e) {
    if (e.data === 'projectbots-close') {
      iframe.style.display = 'none';
      bubble.style.display = 'flex';
      isOpen = false;
    }
  });

  // Append to page
  document.body.appendChild(bubble);
  document.body.appendChild(iframe);
})();