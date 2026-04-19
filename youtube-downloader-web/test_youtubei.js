import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const types = ['WEB', 'WEB_REMIX', 'MWEB', 'IOS', 'ANDROID'];
  for (const client of types) {
    try {
      console.log(`Trying ${client}...`);
      const yt = await Innertube.create({ client_type: client, generate_session_locally: true });
      const info = await yt.getInfo('fJ9rUzIMcZQ');
      console.log(`Playability (${client}):`, info.playability_status.status);
    } catch (err) { }
  }
}
test();
