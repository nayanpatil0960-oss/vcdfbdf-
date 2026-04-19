import yt from 'youtube-dl-exec';
import fs from 'fs';

const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function test() {
  const subprocess = yt.exec(url, {
    format: '18',
    output: '-'
  });
  
  subprocess.stdout.pipe(fs.createWriteStream('test.mp4'));
  
  subprocess.on('close', () => console.log('Done'));
}
test();
