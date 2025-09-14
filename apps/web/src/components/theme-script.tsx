export function ThemeScript() {
  const themeScript = `
    (function() {
      function getTheme() {
        const stored = localStorage.getItem('globapay-theme');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          return stored;
        }
        return 'system';
      }
      
      function applyTheme(theme) {
        let resolvedTheme;
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolvedTheme = theme;
        }
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.setAttribute('data-theme', resolvedTheme);
      }
      
      const theme = getTheme();
      applyTheme(theme);
      
      // Listen for storage changes
      window.addEventListener('storage', function(e) {
        if (e.key === 'globapay-theme') {
          applyTheme(e.newValue || 'system');
        }
      });
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}