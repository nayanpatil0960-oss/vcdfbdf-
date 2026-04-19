import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ client_type: 'ANDROID' });
  
  // Make a raw request instead of getInfo
  const response = await yt.actions.execute('/player', {
    videoId: 'fJ9rUzIMcZQ',
    client: 'ANDROID',
  });

  console.log("Response streaming data formats:", response.data.streamingData?.formats?.length);
  if (response.data.playabilityStatus) {
    console.log("Playability:", response.data.playabilityStatus.status);
  }
}

test();
