import yt from 'youtube-dl-exec';

const url = 'https://www.youtube.com/playlist?list=PLD0D54219E5F2544D';

async function test() {
  const info = await yt(url, { dumpSingleJson: true, flatPlaylist: true, noWarnings: true });
  console.log(info.title);
  console.log(info.channel);
  console.log(info.entries ? info.entries.length : 0);
  if (info.entries && info.entries.length > 0) {
      console.log(info.entries[0]);
  }
}
test();
