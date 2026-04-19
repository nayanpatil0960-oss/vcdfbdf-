async function run() {
    const urls = [
        "https://cobalt.tools/_app/immutable/nodes/0.D6rog7AP.js",
        "https://cobalt.tools/_app/immutable/nodes/4.CHK7gD8s.js"
    ];
    for(const u of urls) {
        const res = await fetch(u);
        const text = await res.text();
        const apiInstances = text.match(/https:\/\/[A-Za-z0-9.-]*cobalt[A-Za-z0-9.-]*\.[A-Za-z.-]+/g);
        if (apiInstances) console.log("FOUND IN", u, [...new Set(apiInstances)]);
    }
}
run();
