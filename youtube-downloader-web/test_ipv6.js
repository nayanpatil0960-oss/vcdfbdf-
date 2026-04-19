import youtubeDl from 'youtube-dl-exec';

async function run() {
  try {
    console.log("Testing IPv6");
    const output = await youtubeDl('https://www.youtube.com/watch?v=fJ9rUzIMcZQ', {
      dumpJson: true,
      noWarnings: true,
      forceIpv6: true
    });
    console.log(`✅ SUCCESS! Title: ${output.title}`);
  } catch (e) {
    console.log(`❌ FAILED: ${e.message.substring(0, 500)}`);
  }
}

run();
