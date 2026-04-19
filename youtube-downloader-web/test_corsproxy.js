async function test() {
    console.log("Testing corsproxy.io");
    const res = await fetch("https://corsproxy.io/?https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DfJ9rUzIMcZQ");
    const text = await res.text();
    console.log(text.substring(0, 1000));
}
test();
