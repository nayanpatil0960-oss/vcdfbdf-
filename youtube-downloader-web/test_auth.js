import yt from 'youtube-dl-exec';

async function test() {
  try {
    const info = await yt('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { dumpJson: true });
    console.log('SUCCESS:', info.title);
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}
test();
