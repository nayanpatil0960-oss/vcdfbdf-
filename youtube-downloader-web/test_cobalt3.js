import * as cheerio from 'cheerio';
async function test() {
    const jsRes = await fetch("https://cobalt.tools/_app/immutable/entry/app.DEexWfY5.js");
    const jsText = await jsRes.text();
    console.log("Urls:", jsText.match(/https:\/\/[A-Za-z0-9.-]*cobalt[A-Za-z0-9.-]*/g));
}
test();
