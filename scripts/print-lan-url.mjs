import os from 'node:os';

function getLanAddresses() {
  const addresses = [];
  const nets = os.networkInterfaces();

  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      if (!addresses.includes(entry.address)) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses.length ? addresses : ['127.0.0.1'];
}

function preferredAddress(addresses) {
  const wifiLike = addresses.find((ip) => ip.startsWith('192.168.') && !ip.startsWith('192.168.64.'));
  return wifiLike ?? addresses.find((ip) => !ip.startsWith('172.')) ?? addresses[0];
}

const webPort = process.env.WEB_PORT ?? '3000';
const apiPort = process.env.API_PORT ?? '4000';
const addresses = getLanAddresses();
const primaryIp = preferredAddress(addresses);

console.log('');
console.log('=== Pharma LAN URLs (same Wi‑Fi / network) ===');
console.log(`Website (share this):  http://${primaryIp}:${webPort}`);
console.log(`Modules / POS:         http://${primaryIp}:${webPort}/modules`);
console.log(`Login:                 http://${primaryIp}:${webPort}/login`);
console.log(`API (optional):        http://${primaryIp}:${apiPort}`);
console.log('');
console.log('On this PC: http://localhost:' + webPort);
if (addresses.length > 1) {
  console.log('Other IPs on this PC (try if link fails):');
  for (const ip of addresses) {
    console.log(`  http://${ip}:${webPort}`);
  }
}
console.log('');
console.log('Friends must use the same Wi‑Fi (not mobile data). Allow Node.js in Windows Firewall if asked.');
console.log('');
