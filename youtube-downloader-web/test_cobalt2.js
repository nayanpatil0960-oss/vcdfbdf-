import * as cheerio from 'cheerio';
async function test() {
    const instancesRes = await fetch("https://cobalt.tools/");
    const instancesHtml = await instancesRes.text();
    const $ = cheerio.load(instancesHtml);
    console.log("Scripts:");
    $('script').each((i, el) => console.log($(el).attr('type'), $(el).attr('src')));
    console.log("Links:");
    $('link').each((i, el) => console.log($(el).attr('rel'), $(el).attr('href')));
}
test();
