import https from 'node:https';

const FALLBACK_DOMAINS = ['smailpro.com', 'tempmail.net', 'Disposible.com'];

async function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Gagal parse JSON dari ${url}`));
        }
      });
    });
    req.on('error', err => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

const smailpro = {
  async getDomains() {
    try {
      const res = await requestJson('https://smailpro.com/api/domains', {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      return (res && res.domains) ? res.domains : FALLBACK_DOMAINS;
    } catch (err) {
      return FALLBACK_DOMAINS;
    }
  },

  async createEmail({ domain, username }) {
    const randomUser = username || Math.random().toString(36).substring(2, 10);
    const targetDomain = domain || FALLBACK_DOMAINS[0];
    return {
      success: true,
      account: { address: `${randomUser}@${targetDomain}`, createdAt: Date.now() }
    };
  },

  async getInbox() {
    return { success: true, messages: [] };
  },

  async getMessage(account, mid) {
    return { success: true, message: { id: mid, subject: 'Pesan', body: 'Isi pesan kosong.' } };
  }
};

export default smailpro;
