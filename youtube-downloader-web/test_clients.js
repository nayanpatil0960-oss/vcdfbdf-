import youtubeDl from 'youtube-dl-exec';

const clients = [
  'web',
  'android',
  'ios',
  'tv', // tv isn't always affected by bot checks?
  'tv_embedded', // no
  'mweb',
  'default',
  'android_vr',
  'web_creator'
];

async function run() {
  for (const client of clients) {
    try {
      console.log(`\nTesting client: ${client}`);
      const output = await youtubeDl('https://www.youtube.com/watch?v=fJ9rUzIMcZQ', {
        dumpJson: true,
        noWarnings: true,
        extractorArgs: `youtube:player_client=${client}`
      });
      console.log(`✅ SUCCESS WITH ${client}! Title: ${output.title}`);
    } catch (e) {
      console.log(`❌ FAILED WITH ${client}: ${e.message.substring(0, 100)}`);
    }
  }
}

run();
