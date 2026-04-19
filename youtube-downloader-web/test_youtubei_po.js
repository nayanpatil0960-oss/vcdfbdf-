import { Innertube } from 'youtubei.js';
import { generate } from 'youtube-po-token-generator';

async function test() {
  const session = await generate();
  console.log("Token:", session.poToken);
  
  const yt = await Innertube.create({ 
      po_token: session.poToken,
      visitor_data: session.visitorData,
      generate_session_locally: true,
      client_type: 'WEB'
  });
  
  const info = await yt.getInfo('fJ9rUzIMcZQ');
  console.log("Playability:", info.playability_status.status);
  console.log("Formats:", info.streaming_data?.formats?.length);
}
test();
