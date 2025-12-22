// Файл: check-snow.js
(function() {
  function shouldShowSnow() {
    const now = new Date();
    // const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    
    if (currentMonth === 12 && currentDay >= 10) {
      return true;
    }
    
    if (currentMonth === 1 && currentDay <= 12) {
      return true;
    }
    
    return false;
  }
  
  if (shouldShowSnow()) {
    console.log('[NIGHTLY DEBUG] happy new year!');
    
    const snowScript = document.createElement('script');
    snowScript.src = 'assets/js/pure-snow.js';
    snowScript.defer = true;
    snowScript.onload = function() {
      console.log('[NIGHTLY DEBUG] snow script loaded');
    };
    snowScript.onerror = function() {
      console.error('[NIGHTLY DEBUG] snow script loading err');
    };
    
    document.head.appendChild(snowScript);
  } else {
    console.log('[NIGHTLY DEBUG] no snow');
  }
})();