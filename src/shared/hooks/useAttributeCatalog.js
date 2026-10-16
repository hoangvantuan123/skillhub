import { useEffect, useState } from 'react';
import { attributeCatalog } from '../../features/catalog/services/attributeCatalog';

export default function useAttributeCatalog(key) {
  const [catalog, setCatalog] = useState({ key, label: '', options: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const { data } = await attributeCatalog.get(key);
        if (active) { setCatalog(data); setError(''); }
      } catch (failure) { if (active) setError(failure.message); }
      finally { if (active) setLoading(false); }
    };
    refresh();
    window.addEventListener('skillhub:catalog-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => { active = false; window.removeEventListener('skillhub:catalog-updated', refresh); window.removeEventListener('storage', refresh); };
  }, [key]);
  return {
    ...catalog, error, loading,
    optionsFor(value, { includeAll = true } = {}) {
      const options = catalog.options.filter(option => (includeAll || option.value !== 'All') && (option.active || option.value === value))
        .map(option => ({ value: option.value, label: option.label + (option.active ? '' : ' (Ngừng sử dụng)'), disabled: !option.active }));
      if (value && !options.some(option => option.value === value)) options.push({ value, label: `${value} (Giá trị đã lưu)`, disabled: true });
      return options;
    },
    labelFor(value) { return catalog.options.find(option => option.value === value)?.label || value || '—'; },
  };
}
