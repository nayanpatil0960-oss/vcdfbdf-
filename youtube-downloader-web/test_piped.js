async function testPiped() {
    const instances = [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.tokhmi.xyz',
        'https://piped-api.garudalinux.org',
        'https://pipedapi.smnz.de'
    ];

    for (const inst of instances) {
        try {
            console.log("Testing", inst);
            const res = await fetch(`${inst}/streams/fJ9rUzIMcZQ`);
            if (res.ok) {
                const data = await res.json();
                console.log(`Success with ${inst}`);
                console.log("Title:", data.title);
                console.log("Audio formats:", data.audioStreams?.length);
                console.log("Video formats:", data.videoStreams?.length);
                
                // test if the url works
                if (data.audioStreams?.[0]?.url) {
                    const audioRes = await fetch(data.audioStreams[0].url, { method: 'HEAD' });
                    console.log("Audio URL Status:", audioRes.status);
                }
                return;
            } else {
                console.log("Failed:", res.status);
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}
testPiped();
