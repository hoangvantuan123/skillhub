// Match Vietnamese labels with or without accents; never change stored option values.
export const normalizeOptionSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
export function filterSelectOptions(options, query) {
  const tokens = normalizeOptionSearch(query).split(/\s+/).filter(Boolean);
  return options.filter(option => { const text = normalizeOptionSearch(option.label) + ' ' + normalizeOptionSearch(option.value); return tokens.every(token => text.includes(token)); });
}
