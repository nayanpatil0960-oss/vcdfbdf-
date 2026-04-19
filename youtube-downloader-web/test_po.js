import { generate } from 'youtube-po-token-generator';
import youtubeDl from 'youtube-dl-exec';

async function run() {
    try {
        console.log("Generating PO Token...");
        const session = await generate();
        console.log("Session:", session);
        
        console.log("Invoking yt-dlp...");
        const output = await youtubeDl('https://www.youtube.com/watch?v=fJ9rUzIMcZQ', {
            dumpJson: true,
            noWarnings: true,
            extractorArgs: `youtube:player_client=web;po_token=web+${session.poToken}`
        });
        
        console.log(`✅ SUCCESS! Title: ${output.title}`);
    } catch (e) {
        console.log(`❌ FAILED: ${e.message.substring(0, 500)}`);
    }
}
run();
