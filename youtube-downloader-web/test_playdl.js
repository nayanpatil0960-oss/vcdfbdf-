import play from 'play-dl';

async function test() {
  try {
    const video = await play.video_info('https://www.youtube.com/watch?v=fJ9rUzIMcZQ');
    console.log('SUCCESS:', video.video_details.title);
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}
test();
