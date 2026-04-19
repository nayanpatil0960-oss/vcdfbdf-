import yt from 'youtube-dl-exec';

async function test() {
  try {
    const info = await yt('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { 
      dumpJson: true, 
      noWarnings: true
    });
    console.log(`SUCCESS:`, info.title);
    return;
  } catch (err) {
    console.log(`FAILED`, err.message);
  }
}
test();
