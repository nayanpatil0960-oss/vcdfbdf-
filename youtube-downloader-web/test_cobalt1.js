import axios from 'axios';
async function test() {
    try {
        const response = await axios.post('https://api.cobalt.tools/', {
            url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
        }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        console.log(response.data);
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
test();
