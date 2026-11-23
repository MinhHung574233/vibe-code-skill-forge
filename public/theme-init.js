// Applies a saved manual theme before first paint (no light/dark flash).
// Kept as an external file (not inline) so the Content-Security-Policy can forbid inline scripts.
try {
  var t = localStorage.getItem('sf-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {
  /* storage blocked: fall back to the system theme */
}
