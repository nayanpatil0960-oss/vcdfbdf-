async function run() {
    const urls = [
        "https://api.cobalt.tools"
    ];
    for (const url of urls) {
        const res = await fetch(url, {
             method: 'POST',
             headers: {
                 'Accept': 'application/json',
                 'Content-Type': 'application/json',
                 'Origin': 'https://cobalt.tools',
                 'Referer': 'https://cobalt.tools/',
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
             },
             body: JSON.stringify({ url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ" })
        });
        console.log(res.status);
        console.log(await res.text());
    }
}
run();
