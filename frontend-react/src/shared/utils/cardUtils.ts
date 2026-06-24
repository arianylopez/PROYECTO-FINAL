export const validateLuhn = (num: string): boolean => {
  const arr = (num + '')
    .replace(/\D/g, '')
    .split('')
    .reverse()
    .map((x) => parseInt(x, 10));
  if (arr.length < 13) return false;
  const lastDigit = arr.shift()!;
  const sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  return (sum + lastDigit) % 10 === 0;
};

export const detectCardBrand = (num: string): string => {
  const str = num.replace(/\D/g, '');
  if (/^4/.test(str)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(str)) return 'MasterCard';
  if (/^3[47]/.test(str)) return 'Amex';
  if (/^(6011|65)/.test(str)) return 'Discover';
  return 'Unknown';
};

export const isCardExpired = (month: string, year: string): boolean => {
  if (!month || !year) return false;
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  const expY = parseInt(year, 10);
  const expM = parseInt(month, 10);
  return expY < currentYear || (expY === currentYear && expM < currentMonth);
};
