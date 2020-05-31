const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require("body-parser"); //это нужно, чтобы парсить post запросы
//ставит лимит на 50mb, потому что будет подгружать очень много данных,
//так что ставим с запасом
app.use(bodyParser.json({limit: '50mb'}));// to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     
    limit: '50mb',
    extended: true
})); // to support URL-encoded bodies

class CarAccident { //Объекты этого класса передаются во фронт для вывода меток
    constructor(coordinates, victims, fatalities, type) {
        this.coordinates = coordinates; 
        this.victims = victims; //Пострадавшие
        this.fatalities = fatalities; //Погибшие
        this.type = type;
    }
    //число полей можно увеличивать, зависит от того, что хочет видеть пользователь/заказчик
}

class DistrictOfTheCity { //Объекты этого класса -- комплексная статистика по районам
    constructor(coordinates, name, accidents) {
        this.coordinates = coordinates;
        this.name = name;
        this.accidents = accidents; //массив объектов класса CarAccident
        //может быть разграничим как-нибудь по годам, но пока не будем этим заморачиваться
    }
}

let sizeUsers = 1000;

//вызываем наши файлики с инфой
//ЭТО ОБЯЗАТЕЛЬНО НУЖНО КАК-НИБУДЬ ПЕРЕПИСАТЬ НА БАЗЫ ДАННЫХ

//это мап
let carAccidents = {};
carAccidents['2016'] = require('./2016.json');
carAccidents['2017'] = require('./2017.json');
carAccidents['2018'] = require('./2018.json');

let citiesDistricts = {};
citiesDistricts["Москва"] = require('./Msk_Dictrict.json');
citiesDistricts['Санкт-Петербург'] = require('./SPB.json');

//TODO -- подумать над тем, как нам сделать вложенность, т.е. наш сайт со статистикой и инфой
app.use(express.static('public')); //все данные лежат в папке public

//поднимаем на локалхосте
app.listen(8080, function() {
    console.log('Successfully run on port 8080!');
});

//вообще, это -- post-запрос, но его легче и быстрее оформить как get
//dont mind, rewrite someday
app.get('/post_first_searches', function(req, res) {
    sizeUsers = req.query.firstN;
    res.send('OK!');
});

//отправляем с сервера описания ДТП в регионе запроса
app.get('/car_accident_in_region', function(req, res) {
    let regionName = req.query.regionName;
    let year = req.query.year;
    //поскольку этот запрос вызывается не только для вывода меток, но и получения всех меток
    //для детальной статистики по районам, то ставим костыль
    let size = 0;
    if(Number(req.query.n) == 0) {
        //если пользователь задал слишком много ДТП, то не упадёт
        size = Math.min(carAccidents[year].length, sizeUsers);
    }
    else {
        size = carAccidents[year].length;
    }
    //console.log(size);
    let arr = [];
    for (let i = 0; i < size; i++) {
        if (carAccidents[year][i]['reg_name'] == regionName) {
            let accidents = new CarAccident(
                [ Number(carAccidents[year][i]['latitude']), Number(carAccidents[year][i]['longitude'])],
                carAccidents[year][i]['victims_amount'],
                carAccidents[year][i]['fatalities_amount'],
                carAccidents[year][i]['crash_type_name']
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
    //нам нужны и названия, и координаты
    //я не стал создавать отдельно структуру, так что отправляем пару
    for(let i = 0; i < citiesDistricts[cityName].features.length; i++) {
        arrNames.push(citiesDistricts[cityName].features[i].properties.DistrName);
        arrCoordinates.push(citiesDistricts[cityName].features[i].geometry.coordinates);
    }
    res.send([arrNames, arrCoordinates]);
});

//записываем файлы с информацией по районам
//этот запрос отработает один раз
//но его не буду удалять, т.к. при обновлении датасетов его нужно будет использовать
app.post('/districts_save_data', function(req, res) {
    console.log('here');
    //console.log(req.body);
    let accidentsArray = req.body.accidentsArray;
    let districtsCoordinates = req.body.districtsCoordinates;
    let districtsNames = req.body.districtsNames;
    let cityName = req.body.cityName;
    let ans = [];
    fs.writeFile('./' + cityName + '.txt', '', function(){console.log('done')}); //чистим старый файл с инфой
    let stream = fs.createWriteStream('./' + req.body.cityName + '.txt');
    for(let i = 0; i < districtsNames.length; ++i) {
        let item = new DistrictOfTheCity(districtsCoordinates[i], districtsNames[i], [accidentsArray[0][i], accidentsArray[1][i], accidentsArray[2][i]]);
        ans.push(item);
    }
    let item = {
        CityName: cityName,
        Info: ans
    };
    let str = JSON.stringify(item); //такой объект потом проще парсить из файла
    stream.write(str);
    stream.close();
    res.send('Ok!');
});
