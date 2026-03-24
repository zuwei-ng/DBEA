export const currencyFlags = {
  'USD': '🇺🇸',
  'SGD': '🇸🇬',
  'EUR': '🇪🇺',
  'GBP': '🇬🇧',
  'JPY': '🇯🇵',
  'CNY': '🇨🇳',
  'AUD': '🇦🇺',
  'CAD': '🇨🇦'
};

export const getCurrencyFlag = (currency) => currencyFlags[currency] || '🏳️';
