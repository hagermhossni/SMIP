/**
 * Creates the standard title/subtitle overlay shown in the top-left of
 * every module view, so each module doesn't repeat this markup.
 *
 * @param {string} title
 * @param {string} subtitle
 * @returns {HTMLElement}
 */
export function createModuleHeader(title, subtitle) {
  const header = document.createElement('div');
  header.className = 'module-view__header';

  const titleEl = document.createElement('h1');
  titleEl.className = 'module-view__title';
  titleEl.textContent = title;

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'module-view__subtitle';
  subtitleEl.textContent = subtitle;

  header.append(titleEl, subtitleEl);
  return header;
}
