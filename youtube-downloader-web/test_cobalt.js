async function test() {
    const res = await fetch('https://raw.githubusercontent.com/imputnet/cobalt/current/docs/instances.json');
    if (res.ok) {
        console.log("Found");
        console.log((await res.text()).substring(0, 500));
    } else {
        console.log("Not found", res.status, res.statusText);
    }
}
test();
