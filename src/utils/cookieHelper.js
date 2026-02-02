const fs = require('fs');
const path = require('path');

async function loadCookies() {
  try {
    const filePath = path.resolve(__dirname, '../../www.mercadolivre.com.br_cookies.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const cookies = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      if (!line.trim() || line.startsWith('#')) return;
      const parts = line.split('\t');
      if (parts.length >= 7) {
        cookies.push({
          name: parts[5],
          value: parts[6].trim(),
          domain: parts[0],
          path: parts[2],
          secure: parts[3] === 'TRUE',
          httpOnly: parts[1] === 'TRUE'
        });
      }
    });

    const essentialNames = ['ssid', '_d2id', '_dsid', 'cp'];
    return cookies.filter(c => essentialNames.includes(c.name));
  } catch (error) {
    console.error('Erro ao ler cookies:', error.message);
    return [];
  }
}

module.exports = { loadCookies };