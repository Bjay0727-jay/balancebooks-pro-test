import { CATEGORIES } from './constants';
import { uid } from './helpers';

export const parseDate = (dateValue) => {
  if (!dateValue && dateValue !== 0) return null;

  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue.trim()))) {
    const num = parseFloat(dateValue);
    if (num > 0 && num < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + num * 86400000);
      if (!isNaN(date.getTime())) {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      }
    }
  }

  const str = String(dateValue).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;

  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;

  const usShortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usShortMatch) {
    const y = parseInt(usShortMatch[3]) > 50 ? '19' + usShortMatch[3] : '20' + usShortMatch[3];
    return `${y}-${usShortMatch[1].padStart(2, '0')}-${usShortMatch[2].padStart(2, '0')}`;
  }

  const usDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (usDashMatch) return `${usDashMatch[3]}-${usDashMatch[1].padStart(2, '0')}-${usDashMatch[2].padStart(2, '0')}`;

  const longDateMatch = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longDateMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const m = monthNames.findIndex(name => longDateMatch[1].toLowerCase().startsWith(name));
    if (m >= 0) return `${longDateMatch[3]}-${String(m + 1).padStart(2, '0')}-${longDateMatch[2].padStart(2, '0')}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return null;
};

export const mapCategory = (catName) => {
  if (!catName) return 'other';
  const lower = String(catName).toLowerCase().trim();

  const exactMatch = CATEGORIES.find(c => c.id === lower || c.name.toLowerCase() === lower);
  if (exactMatch) return exactMatch.id;

  const aliases = {
    'tithe': 'tithes', 'tithes': 'tithes', 'offering': 'tithes', 'offerings': 'tithes', 'church': 'tithes',
    'donation': 'gifts', 'donations': 'gifts', 'gift': 'gifts', 'charity': 'gifts',
    'baby': 'childcare', 'daycare': 'childcare', 'child': 'childcare', 'kids': 'childcare',
    'pet': 'pets', 'dog': 'pets', 'cat': 'pets', 'vet': 'pets',
    'hair': 'personal', 'salon': 'personal', 'spa': 'personal',
    'gym': 'healthcare', 'medical': 'healthcare', 'doctor': 'healthcare', 'pharmacy': 'healthcare',
    'car': 'transportation', 'auto': 'transportation', 'gas': 'transportation', 'fuel': 'transportation',
    'uber': 'transportation', 'lyft': 'transportation',
    'food': 'groceries', 'grocery': 'groceries', 'supermarket': 'groceries',
    'restaurant': 'dining', 'coffee': 'dining', 'cafe': 'dining', 'takeout': 'dining',
    'netflix': 'subscriptions', 'spotify': 'subscriptions', 'hulu': 'subscriptions',
    'amazon': 'shopping', 'walmart': 'shopping', 'target': 'shopping',
    'rent': 'housing', 'mortgage': 'housing',
    'electric': 'utilities', 'water': 'utilities', 'internet': 'utilities', 'phone': 'utilities',
    'salary': 'income', 'paycheck': 'income', 'wages': 'income', 'freelance': 'income',
  };

  for (const [alias, catId] of Object.entries(aliases)) {
    if (lower.includes(alias)) return catId;
  }

  const partialMatch = CATEGORIES.find(c =>
    c.name.toLowerCase().includes(lower) || lower.includes(c.id) || lower.includes(c.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.id;

  return 'other';
};

export const parseCSV = (content) => {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const txs = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    try {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
        else { current += char; }
      }
      parts.push(current.trim());
      if (parts.length < 3) continue;

      const [dateStr, desc, amountStr, cat = '', type = '', paid = ''] = parts.map(p => p.replace(/"/g, '').trim());
      const date = parseDate(dateStr);
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

      if (!date) { errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`); continue; }
      if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
      if (isNaN(amount)) { errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`); continue; }

      const isIncome = type.toLowerCase() === 'income' || (amount > 0 && !type);
      txs.push({
        id: uid(), date, desc,
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        category: isIncome ? 'income' : mapCategory(cat),
        paid: ['yes', '1', 'true', 'y', 'paid'].includes(String(paid).toLowerCase()),
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: Parse error - ${e.message}`);
    }
  }
  return { transactions: txs, errors };
};

export const parseExcel = async (file) => {
  return new Promise((resolve) => {
    const XLSX = window.XLSX;
    if (!XLSX) {
      resolve({ transactions: [], errors: ['Excel support requires the XLSX library. Please save as CSV and import that instead.'] });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' });

        const txs = [];
        const errors = [];
        const headers = json[0]?.map(h => String(h || '').toLowerCase().trim()) || [];

        const dateCol = headers.findIndex(h => h.includes('date'));
        const descCol = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('payee') || h.includes('name'));
        const amountCol = headers.findIndex(h => h.includes('amount') || h.includes('sum') || h.includes('total'));
        const catCol = headers.findIndex(h => h.includes('cat') || h.includes('type'));
        const typeCol = headers.findIndex(h => h === 'type' || h.includes('income') || h.includes('expense'));
        const paidCol = headers.findIndex(h => h.includes('paid') || h.includes('status') || h.includes('cleared'));

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.every(cell => !cell)) continue;

          const dateVal = row[dateCol >= 0 ? dateCol : 0];
          const desc = row[descCol >= 0 ? descCol : 1];
          const amountVal = row[amountCol >= 0 ? amountCol : 2];
          const cat = row[catCol >= 0 ? catCol : 3];
          const type = row[typeCol >= 0 ? typeCol : 4];
          const paid = row[paidCol >= 0 ? paidCol : 5];

          const date = parseDate(dateVal);
          const amount = parseFloat(String(amountVal || '0').replace(/[$,]/g, ''));

          if (!date) { errors.push(`Row ${i + 1}: Invalid date "${dateVal}"`); continue; }
          if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
          if (isNaN(amount) || amount === 0) { errors.push(`Row ${i + 1}: Invalid amount "${amountVal}"`); continue; }

          const isIncome = String(type || '').toLowerCase() === 'income' ||
                           String(cat || '').toLowerCase() === 'income' || amount > 0;

          txs.push({
            id: uid(), date, desc: String(desc).trim(),
            amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
            category: isIncome ? 'income' : mapCategory(cat),
            paid: ['yes', '1', 'true', 'y', 'cleared', 'paid'].includes(String(paid || '').toLowerCase()),
          });
        }
        resolve({ transactions: txs, errors });
      } catch (err) {
        resolve({ transactions: [], errors: [`Failed to parse Excel file: ${err.message}. Please save as CSV and try again.`] });
      }
    };
    reader.onerror = () => resolve({ transactions: [], errors: ['Failed to read file.'] });
    reader.readAsArrayBuffer(file);
  });
};
