import dns from 'dns';
const dnsPromises = dns.promises;

export function getRecommendedDnsRecords(domain, serverHost, serverIp) {
  const cleanDomain = domain.trim().toLowerCase();
  const cleanHost = (serverHost || `mail.${cleanDomain}`).trim().toLowerCase();
  const ip = (serverIp || '127.0.0.1').trim();

  return [
    {
      step: 1,
      type: 'A',
      title: 'A Record (Mail Server Host)',
      host: 'mail',
      hostAlternative: cleanHost,
      value: ip,
      priority: null,
      ttl: 'Auto / 3600',
      instruction: `Select Type "A", set Host / Name to "mail", and set Points to / Value to "${ip}"`,
      description: `Maps your mail server sub-domain (${cleanHost}) to your server's public IP address.`
    },
    {
      step: 2,
      type: 'MX',
      title: 'MX Record (Mail Routing)',
      host: '@',
      hostAlternative: cleanDomain,
      value: cleanHost,
      priority: 10,
      ttl: 'Auto / 3600',
      instruction: `Select Type "MX", set Host / Name to "@", set Priority to "10", and set Mail Server / Value to "${cleanHost}"`,
      description: `Tells the internet to deliver all incoming emails for @${cleanDomain} directly to your mail server.`
    },
    {
      step: 3,
      type: 'TXT',
      title: 'SPF Record (Sender Policy Framework)',
      host: '@',
      hostAlternative: cleanDomain,
      value: `v=spf1 mx a:${cleanHost} ~all`,
      priority: null,
      ttl: 'Auto / 3600',
      instruction: `Select Type "TXT", set Host / Name to "@", and set Content / Value to "v=spf1 mx a:${cleanHost} ~all"`,
      description: `Verifies that only your mail server is authorized to send emails from @${cleanDomain} (prevents spoofing).`
    },
    {
      step: 4,
      type: 'TXT',
      title: 'DMARC Record (Email Authentication Policy)',
      host: '_dmarc',
      hostAlternative: `_dmarc.${cleanDomain}`,
      value: `v=DMARC1; p=none; sp=none; rua=mailto:postmaster@${cleanDomain}`,
      priority: null,
      ttl: 'Auto / 3600',
      instruction: `Select Type "TXT", set Host / Name to "_dmarc", and set Content / Value to "v=DMARC1; p=none; sp=none; rua=mailto:postmaster@${cleanDomain}"`,
      description: `Defines security rules and delivery reports for emails sent from your domain.`
    }
  ];
}

export async function verifyDomainDns(domain, expectedHost) {
  const results = {
    domain,
    expectedHost,
    mxConfigured: false,
    mxRecords: [],
    spfConfigured: false,
    spfRecord: null,
    errors: []
  };

  try {
    const mxList = await dnsPromises.resolveMx(domain);
    results.mxRecords = mxList;
    results.mxConfigured = mxList.some(mx => 
      mx.exchange.toLowerCase().includes(expectedHost.toLowerCase()) ||
      mx.exchange.toLowerCase() === domain.toLowerCase()
    );
  } catch (err) {
    results.errors.push(`MX lookup failed: ${err.message}`);
  }

  try {
    const txtRecords = await dnsPromises.resolveTxt(domain);
    const flattened = txtRecords.map(t => t.join(''));
    const spf = flattened.find(record => record.startsWith('v=spf1'));
    if (spf) {
      results.spfRecord = spf;
      results.spfConfigured = true;
    }
  } catch (err) {
    results.errors.push(`TXT/SPF lookup failed: ${err.message}`);
  }

  return results;
}
