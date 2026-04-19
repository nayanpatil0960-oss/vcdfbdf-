import youtubeDl from 'youtube-dl-exec';

async function testPlaylist() {
    try {
        console.log("Fetching playlist items...");
        const output = await youtubeDl('https://www.youtube.com/playlist?list=PLw-VjHDlEOgvtnnnqWlTqByAtC7tXBg6D', {
            dumpSingleJson: true,
            flatPlaylist: true,
            noWarnings: true
        });
        console.log("Success! Items count:", output.entries?.length);
        console.log("First item:", output.entries?.[0]?.title);
    } catch (e) {
        console.log(`❌ Failed: ${e.message.substring(0, 500)}`);
    }
}
testPlaylist();
