async function testLoaderPlaylist() {
    console.log("Testing loader.to playlist");
    const res = await fetch(`https://loader.to/ajax/download.php?start=1&end=3&format=mp3&url=https://www.youtube.com/playlist?list=PLw-VjHDlEOgvtnnnqWlTqByAtC7tXBg6D`);
    const data = await res.json();
    console.log("Response:", data);
}
testLoaderPlaylist();
