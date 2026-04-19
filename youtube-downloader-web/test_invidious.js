async function testInvidious() {
    const instances = [
        'https://vid.puffyan.us',
        'https://invidious.jing.rocks',
        'https://yt.artemislena.eu',
        'https://invidious.nerdvpn.de'
    ];

    for (const inst of instances) {
        try {
            console.log("Testing", inst);
            const res = await fetch(`${inst}/api/v1/videos/fJ9rUzIMcZQ`);
            if (res.ok) {
                const data = await res.json();
                console.log(`Success with ${inst}`);
                console.log("Title:", data.title);
                console.log("Formats:", data.formatStreams?.length, data.adaptiveFormats?.length);
                return;
            } else {
                console.log("Failed:", res.status);
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}
testInvidious();
