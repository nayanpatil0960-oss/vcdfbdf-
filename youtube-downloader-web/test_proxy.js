import youtubeDl from 'youtube-dl-exec';

async function run() {
    console.log("Fetching proxies...");
    const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt');
    const text = await res.text();
    const proxies = text.split('\n').filter(p => p.trim() !== '');
    
    for (let i = 0; i < 5; i++) {
        const randIndex = Math.floor(Math.random() * proxies.length);
        const proxy = 'http://' + proxies[randIndex].trim();
        try {
            console.log("Trying proxy", proxy);
            const output = await youtubeDl('https://www.youtube.com/watch?v=fJ9rUzIMcZQ', {
                dumpJson: true,
                noWarnings: true,
                proxy: proxy,
                socketTimeout: 10
            });
            console.log("SUCCESS WITH PROXY " + proxy + "! Title: " + output.title);
            return;
        } catch (e) {
            console.log("Failed");
        }
    }
}
run();
