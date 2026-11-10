import dns from 'dns';
const dnsPromises = dns.promises;

export function getRecommendedDnsRecords(domain, serverHost, serverIp) {
  const cleanDomain = domain.trim().toLowerCase();
  const cleanHost = serverHost.trim().toLowerCase();
  const ip = serverIp.trim();

  return [
    {
      type: 'A',
      name: cleanHost,
      value: ip,
      ttl: 3600,
      description: 'Points your mail server hostname to this server’s public IP address.'
    },
    {
      type: 'MX',
      name: cleanDomain,
      value: `${cleanHost} (Priority 10)`,
      priority: 10,
      ttl: 3600,
      description: 'Directs incoming emails for @' + cleanDomain + ' to your mail server.'
    },
    {
      type: 'TXT (SPF)',
      name: cleanDomain,
      value: `v=spf1 mx a:${cleanHost} ~all`,
      ttl: 3600,
      description: 'Authorizes your mail server IP to send emails on behalf of @' + cleanDomain + '.'
    },
    {
      type: 'TXT (DMARC)',
      name: `_dmarc.${cleanDomain}`,
      value: `v=DMARC1; p=none; sp=none; rua=mailto:postmaster@${cleanDomain}`,
      ttl: 3600,
      description: 'DMARC policy for email alignment and deliverability reports.'
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
