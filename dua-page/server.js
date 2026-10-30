const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname)));

app.listen(3010, () => {
    console.log('Islamic Dua page running on http://localhost:3010');
});
