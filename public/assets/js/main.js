/**
 * Sample Store - Main Entrypoint & Initialization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render Header & Footer placeholders
  renderHeader();
  renderFooter();

  // 2. Initialize State
  await state.init();
});
