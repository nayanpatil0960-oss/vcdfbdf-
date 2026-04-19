async function testCors() {
    const res = await fetch("https://loader.to/ajax/download.php?format=mp3&url=https://www.youtube.com/watch?v=fJ9rUzIMcZQ", {
        method: "GET",
    });
    console.log("CORS headers:", res.headers.get("access-control-allow-origin"));
}
testCors();
