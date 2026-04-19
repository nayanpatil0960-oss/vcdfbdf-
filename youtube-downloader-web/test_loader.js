async function testLoader() {
    console.log("Testing loader.to 1080p download progression");
    const res = await fetch(`https://loader.to/ajax/download.php?start=1&end=1&format=1080&url=https://www.youtube.com/watch?v=fJ9rUzIMcZQ`);
    const data = await res.json();
    console.log("Response:", data);
    
    if (data.id) {
        console.log("Got task ID. Polling...");
        let done = false;
        while (!done) {
            const pRes = await fetch(`https://loader.to/ajax/progress.php?id=${data.id}`);
            const pData = await pRes.json();
            console.log("Progress:", pData);
            if (pData.success === 1 || pData.download_url) {
                console.log("DOWNLOAD URL:", pData.download_url);
                done = true;
            } else if (pData.text && pData.text.includes("Error")) {
                console.log("Error:", pData.text);
                done = true;
            } else {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
}
testLoader();
