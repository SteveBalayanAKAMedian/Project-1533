const express = require('express');
const app = express();

let carAccidents = {};
carAccidents['2016'] = require('./2016.json');
carAccidents['2017'] = require('./2017.json');
carAccidents['2018'] = require('./2018.json');

app.use(express.static('public')); //все данные лежат в папке public
app.get('/hello', function(req, res) {
    res.send('Server is on!');
});

//отправляем с сервера описания ДТП в регионе запроса
app.get('/car_accident_in_region', function(req, res) {
    let regionName = req.query.regionName;
    let year = req.query.year;
    //тестовый вариант, идём не по всему файлу
    //let size = carAccidents[year].length;
    let size = 100;
    let arr = [];
    for (let i = 0; i < size; i++) {
        if (carAccidents[year][i]['reg_name'] === regionName) {
            arr.push([ Number(carAccidents[year][i]['latitude']), Number(carAccidents[year][i]['longitude']) ]);
        }
    }
    res.send(arr);
});

//поднимаем на локалхосте
app.listen(8080, function() {
    console.log('Successfully run on port 8080!');
});