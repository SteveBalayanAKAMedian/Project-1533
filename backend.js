const express = require('express');
const app = express();

app.use(express.static('public')); //все данные лежат в папке public
app.get('/hello', function(req, res) {
    res.send('Hello!')
});

app.listen(3000, function() {
    console.log('Successfully run on port 3000!');
});