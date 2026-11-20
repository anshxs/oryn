/**
 * Email Security and Authentication Header Analyzer
 * Authored by Arpit Rajput <imironman7599@gmail.com>
 * Inspects SPF, DKIM, and DMARC results from RFC 822 email headers.
 */
export function analyzeSecurityHeaders(headers = {}) {
  const result = {
    spf: 'none',
    dkim: 'none',
    dmarc: 'none',
    isSafe: true,
    warnings: []
  };

  const authResults = headers['authentication-results'] || headers['Authentication-Results'] || '';
  const receivedSpf = headers['received-spf'] || headers['Received-SPF'] || '';
  const dkimSignature = headers['dkim-signature'] || headers['DKIM-Signature'] || '';

  // SPF Analysis
  if (typeof receivedSpf === 'string' && receivedSpf) {
    if (receivedSpf.toLowerCase().includes('pass')) {
      result.spf = 'pass';
    } else if (receivedSpf.toLowerCase().includes('fail')) {
      result.spf = 'fail';
      result.warnings.push('SPF validation failed (possible sender address spoofing).');
    } else if (receivedSpf.toLowerCase().includes('softfail')) {
      result.spf = 'softfail';
    }
  }

  // DKIM Analysis
  if (dkimSignature) {
    result.dkim = 'present';
    if (typeof authResults === 'string' && authResults.toLowerCase().includes('dkim=pass')) {
      result.dkim = 'pass';
    }
  }

  // DMARC Analysis
  if (typeof authResults === 'string' && authResults) {
    if (authResults.toLowerCase().includes('dmarc=pass')) {
      result.dmarc = 'pass';
    } else if (authResults.toLowerCase().includes('dmarc=fail')) {
      result.dmarc = 'fail';
      result.warnings.push('DMARC alignment failed.');
    }
  }

  if (result.spf === 'fail' || result.dmarc === 'fail') {
    result.isSafe = false;
  }

  return result;
}
