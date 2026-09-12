/**
 * HariNama Store - Main Entrypoint & Initialization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render Header & Footer placeholders
  renderHeader();
  renderFooter();

  // 2. Initialize State
  await state.init();

  // 3. Scroll effects on header
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.hn-header');
    if (header) {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
});
