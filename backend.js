const express = require('express');
const app = express();

class CarAccident { //Объекты этого класса передаются во фронт для вывода меток
        constructor(coordinates, region, victims, fatalities) {
          this.coordinates = coordinates; 
          this.victims = victims; //Пострадавшие
          this.region = region;
          this.fatalities = fatalities; //Погибшие
    }
}
let carAccidents = {};
carAccidents['2016'] = require('./2016.json');
carAccidents['2017'] = require('./2017.json');
carAccidents['2018'] = require('./2018.json');

let citiesDistricts = {};
citiesDistricts["Москва"] = require('./Msk_Dictrict.json');


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
    let size = 1000;
    console.log('test');
    let arr = [];
    for (let i = 0; i < size; i++) {
        if (carAccidents[year][i]['reg_name'] === regionName) {
            let accidents = new CarAccident(
                [ Number(carAccidents[year][i]['latitude']), Number(carAccidents[year][i]['longitude'])],
                carAccidents[year][i]['reg_name'],
                carAccidents[year][i]['victims_amount'],
                carAccidents[year][i]['fatalities_amount']
            );
            arr.push(accidents);
        }
    }
    res.send(arr);
});

app.get('/districts_coordinates', function(req, res) {
    let arr = [];
    let cityName = req.query.city;
    for(let i = 0; i < citiesDistricts[cityName].features.length; i++) {
        arr.push(citiesDistricts[cityName].features[i].geometry.coordinates);
    }
    res.send(arr);
});

//поднимаем на локалхосте
app.listen(8080, function() {
    console.log('Successfully run on port 8080!');
});