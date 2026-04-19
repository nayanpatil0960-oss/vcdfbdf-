import * as cheerio from 'cheerio';
async function test() {
    const res = await fetch('https://github.com/imputnet/cobalt/discussions/860');
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log($('.comment-body').first().text());
}
test();
