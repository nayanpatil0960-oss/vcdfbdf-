import { generate } from 'youtube-po-token-generator';

const timer = setTimeout(() => {
    console.log("Timeout!");
    process.exit(1);
}, 10000);

generate().then(session => {
    clearTimeout(timer);
    console.log("Session:", session);
    process.exit(0);
}).catch(e => {
    clearTimeout(timer);
    console.error("Error:", e);
    process.exit(1);
});
