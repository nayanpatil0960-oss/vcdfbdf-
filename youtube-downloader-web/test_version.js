import youtubeDl from 'youtube-dl-exec';
async function run() {
  const output = await youtubeDl.exec('', { version: true });
  console.log(output.stdout);
}
run();
