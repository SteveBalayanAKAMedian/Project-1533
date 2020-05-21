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

class DistrictOfTheCity {
    constructor(coordinates, name, numberOfAccidents) {
        this.coordinates = coordinates;
        this.name = name;
        this.numberOfAccidents = numberOfAccidents;
    }
}
//TODO -- написать класс по району
//вызываем наши БД
//мб стоит нормально переписать на MongoDB
//в общем, это мапы
let sizeUsers = 1000;

let carAccidents = {};
carAccidents['2016'] = require('./2016.json');
carAccidents['2017'] = require('./2017.json');
carAccidents['2018'] = require('./2018.json');

let citiesDistricts = {};
citiesDistricts["Москва"] = require('./Msk_Dictrict.json');
citiesDistricts['Санкт-Петербург'] = require('./SPB.json');

//TODO -- подумать над тем, как нам сделать вложенность, т.е. наш сайт со статистикой и инфой
app.use(express.static('public')); //все данные лежат в папке public
app.get('/hello', function(req, res) {
    res.send('Server is on!');
});

app.get('/post_first_searches', function(req, res) {
    sizeUsers = req.query.firstN;
    res.send('OK!');
});

//отправляем с сервера описания ДТП в регионе запроса
app.get('/car_accident_in_region', function(req, res) {
    let regionName = req.query.regionName;
    let year = req.query.year;
    //тестовый вариант, идём не по всему файлу
    //let size = carAccidents[year].length;
    let size = Math.min(carAccidents[year].length, sizeUsers);
    //console.log(size);
    let arr = [];
    for (let i = 0; i < size; i++) {
        if (carAccidents[year][i]['reg_name'] == regionName) {
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

//Отправляем координаты районов города
app.get('/districts_coordinates', function(req, res) {
    let arrCoordinates = [];
    let arrNames = [];
    let cityName = req.query.city;
    for(let i = 0; i < citiesDistricts[cityName].features.length; i++) {
        arrNames.push(citiesDistricts[cityName].features[i].properties.DistrName);
        arrCoordinates.push(citiesDistricts[cityName].features[i].geometry.coordinates);
    }
    res.send([arrNames, arrCoordinates]);
});

//поднимаем на локалхосте
app.listen(8080, function() {
    console.log('Successfully run on port 8080!');
});