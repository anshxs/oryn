let cachedPublicIp = '115.244.141.202';

/**
 * Detects host server public IP using external IP echo services.
 * Defaults gracefully to cached IP if offline or blocked.
 */
export async function detectPublicIp() {
  if (cachedPublicIp && cachedPublicIp !== '127.0.0.1') return cachedPublicIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.ip) {
      cachedPublicIp = data.ip;
      return cachedPublicIp;
    }
  } catch (e) {
    try {
      const res = await fetch('https://ifconfig.me/ip', { signal: AbortSignal.timeout(3000) });
      const text = (await res.text()).trim();
      if (text) {
        cachedPublicIp = text;
        return cachedPublicIp;
      }
    } catch (err) {}
  }
  return cachedPublicIp || '115.244.141.202';
}

export function getCachedPublicIp() {
  return cachedPublicIp;
}
