/**
 * Мгновенно убирает плейсхолдер Telegram (4 квадрата): web_app_ready до полного SDK.
 * @see public/telegram-web-app.js → WebView.postEvent
 */
(function () {
  function resolveBootTheme() {
    try {
      var ds = document.documentElement && document.documentElement.dataset.seashellTheme;
      if (ds === 'dark') return 'dark';
      if (ds === 'light') return 'light';
      var s = JSON.parse(localStorage.getItem('seashell_settings_v1') || '{}');
      var pref = s.theme || 'system';
      if (pref === 'dark') return 'dark';
      if (pref === 'light') return 'light';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      /* ignore */
    }
    return 'light';
  }

  var theme = resolveBootTheme();
  var BG = theme === 'dark' ? '#0a0e14' : '#f4f6fa';

  var root = document.documentElement;
  root.dataset.seashellTheme = theme;
  root.style.background = BG;
  root.style.colorScheme = theme;

  function paintBody() {
    if (document.body) {
      document.body.style.background = BG;
      document.body.style.margin = '0';
    }
  }
  paintBody();
  document.addEventListener('DOMContentLoaded', paintBody);

  function postEvent(eventType, eventData) {
    if (eventData === undefined) eventData = '';
    try {
      if (window.TelegramWebviewProxy != null) {
        window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
        return;
      }
      if (window.external && 'notify' in window.external) {
        window.external.notify(JSON.stringify({ eventType: eventType, eventData: eventData }));
        return;
      }
      if (window.parent != null && window !== window.parent) {
        window.parent.postMessage(JSON.stringify({ eventType: eventType, eventData: eventData }), '*');
      }
    } catch (e) {
      /* ignore */
    }
  }

  postEvent('web_app_set_background_color', { color: BG });
  postEvent('web_app_set_header_color', { color: BG });
  postEvent('web_app_ready');
  postEvent('web_app_expand');
  postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });

  function applyTelegramViewport() {
    var wa = window.Telegram && window.Telegram.WebApp;
    if (!wa) return false;
    try {
      if (typeof wa.disableVerticalSwipes === 'function') {
        wa.disableVerticalSwipes();
      }
      var h = Number(wa.viewportStableHeight || wa.viewportHeight || 0);
      if (h > 0) {
        document.documentElement.style.setProperty('--ss-app-height', h + 'px');
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  applyTelegramViewport();
  document.addEventListener('DOMContentLoaded', applyTelegramViewport);
  var viewportPolls = 0;
  var viewportTimer = window.setInterval(function () {
    if (applyTelegramViewport() || ++viewportPolls >= 40) {
      window.clearInterval(viewportTimer);
    }
  }, 50);

  var android = /Android/i.test(navigator.userAgent || '');
  var wakeDelays = android ? [0, 150, 450, 1000, 2000] : [0, 150, 450];

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      try {
        window.dispatchEvent(new CustomEvent('seashell-app-suspend'));
      } catch (e) {
        /* ignore */
      }
      return;
    }
    for (var i = 0; i < wakeDelays.length; i++) {
      (function (ms) {
        window.setTimeout(wakeTelegramWebView, ms);
      })(wakeDelays[i]);
    }
  });

  function wakeTelegramWebView() {
    applyTelegramViewport();
    postEvent('web_app_expand');
    postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
    try {
      window.dispatchEvent(new CustomEvent('seashell-app-resume'));
    } catch (e) {
      /* ignore */
    }
  }

  function hookTelegramLifecycle() {
    var wa = window.Telegram && window.Telegram.WebApp;
    if (!wa || !wa.onEvent || wa.__seashellLifecycleHook) return false;
    wa.__seashellLifecycleHook = true;
    wa.onEvent('activated', wakeTelegramWebView);
    wa.onEvent('deactivated', function () {
      try {
        window.dispatchEvent(new CustomEvent('seashell-app-suspend'));
      } catch (e) {
        /* ignore */
      }
    });
    wa.onEvent('visibility_changed', function (data) {
      if (data && data.is_visible) wakeTelegramWebView();
      else {
        try {
          window.dispatchEvent(new CustomEvent('seashell-app-suspend'));
        } catch (e) {
          /* ignore */
        }
      }
    });
    return true;
  }

  var lifecyclePolls = 0;
  var lifecycleTimer = window.setInterval(function () {
    if (hookTelegramLifecycle() || ++lifecyclePolls >= 80) {
      window.clearInterval(lifecycleTimer);
    }
  }, 50);
})();
