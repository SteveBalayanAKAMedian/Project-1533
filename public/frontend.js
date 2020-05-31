let myMap;
let objectManager;
let allRequiredMarksMap = new Map(); //объекты внутри objectManager'a
let idOfMarks = 0; //считаем айдишники всех меток для корректной работы
let allRequiredDistrictsMap = new Map();
let updateMap = false;
let updateRegion = '';
let updateYear = '';

document.addEventListener('DOMContentLoaded', init);

//инициализация всего
//TODO -- 100500 кнопок переписать на нормальные менюшки
//TODO -- переписать init, добавив много маленьких функций-инициализаторов, а то много и не оч понятно/приятно
function init() {
    ymaps.ready(initMap);
    //поисковая строка отображения ДТП по регионам
    let searchByRegion = document.getElementById('searchByRegion');
    //дополнительное поле под год -- TODO: сделать выползающей менюшкой
    let searchByYear = document.getElementById('searchByYear');
    //кнопка отправки запроса поисковой строки выше
    let btnSendSearchByRegion = document.getElementById('btnSendSearchByRegion');
    //кнопка очистки карты, полной очистки от меток
    let btnClearMap = document.getElementById('btnClearMap');
    btnClearMap.addEventListener('click', clearWholeMap);
    let chooseCitywithDistricts = document.getElementById('chooseCitywithDistricts');
    //тут для красоты
    chooseCitywithDistricts.value = 'Название города';
    searchByRegion.value= "Название региона";
    searchByYear.value= "Год";
    let cityNameTextBox = false; //Если правда, то текст стирали, если ложь, то не стирали
    let yearNumberTextBox = false; 
    let districtsTextBox = false;
    let numberOfAccidentsTextBox = false;
    //мб вот эту штуку можно как-то автоматизировать
    chooseCitywithDistricts.addEventListener('click', () => {
        if(!districtsTextBox) {
            chooseCitywithDistricts.value = "";
            districtsTextBox = true;
        }
    })
    searchByRegion.addEventListener('click', () => {
        if (!cityNameTextBox) {
            searchByRegion.value = "";
            cityNameTextBox = true;
        }
    });
    searchByYear.addEventListener('click', () => {
        if (!yearNumberTextBox) {
            searchByYear.value = "";
            yearNumberTextBox = true;
        }
    });
    
    btnSendSearchByRegion.addEventListener('click', querySearchByRegion);
    let btnShowDistricts = document.getElementById('btnShowDistricts');
    btnShowDistricts.addEventListener('click', showDistricts)    
    let firstNumberOfAccidents = document.getElementById('firstNumberOfAccidents');
    firstNumberOfAccidents.value = "Искать среди первых N ДТП";
    firstNumberOfAccidents.addEventListener('click', () => {
        if(!numberOfAccidentsTextBox) {
            numberOfAccidentsTextBox = true;
            firstNumberOfAccidents.value = "";
        }
    });
    let btnEraseSearchByRegion = document.getElementById('btnEraseSearchByRegion');
    btnEraseSearchByRegion.addEventListener('click', removeSearchByRegion);
    let btnRemoveDistrict = document.getElementById('btnRemoveDistrict');
    btnRemoveDistrict.addEventListener('click', clearDistricts)
    let btnSendNumberOfAccidents = document.getElementById('btnSendNumberOfAccidents');
    btnSendNumberOfAccidents.addEventListener('click', postSendNumberOfAccidents);
    let cityWithStatDistricts = document.getElementById('cityWithStatDistricts');
    let btnShowCityWithStatDistricts = document.getElementById('btnShowCityWithStatDistricts');
    btnShowCityWithStatDistricts.addEventListener('click', showCityWithStatDistricts);
}

//инициализация самой карты
function initMap() {
    myMap = new ymaps.Map(
        'map',
        {
            center: [55.76, 37.64],
            zoom: 5
        },
        {
            searchControlProvider: 'yandex#search'
        }
    );
    //тут очень сильно шакалят кластеры, я вообще не понимаю, что это -- TODO: fix
    objectManager = new ymaps.ObjectManager({
        // Чтобы метки начали кластеризоваться, выставляем опцию.
        clusterize: true,
        // ObjectManager принимает те же опции, что и кластеризатор.
        gridSize: 32,
        clusterDisableClickZoom: true
    });
    myMap.geoObjects.add(objectManager);
    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#orangeClusterIcons');
}

//запрос на сервер по региону и году
async function querySearchByRegion() {
    let region = searchByRegion.value;
    let year = searchByYear.value;
    if(updateMap) {
        region = updateRegion;
        year = updateYear;
    }
    if (allRequiredMarksMap.has(region + year)) {
        alert('Что-то не так с вашим запросом');
        return;
    }
    await axios.get('/car_accident_in_region', { params: { regionName: region, year: year, n: 0 } }).then(async function (response) {
        //console.log(response);
        console.log(response.data.length);
        if (response.data.length === 0) {
            alert('Что-то не так с вашим запросом');
        }
        else {
            let carAccidents = response.data;
            //let region = searchByRegion.value;
            let tmp = [];
            console.log(allRequiredMarksMap);
            for (let i = 0; i < carAccidents.length; i++) {
                let pointColor = 'green';
                if (year == 2017) {
                    pointColor = 'blue'
                } 
                else if (year == 2018) {
                    pointColor = 'red'
                }
                let pointIcon = 'Auto';
                if (carAccidents[i].fatalities > 0) {
                    pointIcon = 'Attention';
                }
                let presetPoint = 'islands#' + pointColor + pointIcon + 'CircleIcon';
                let item =  {
                    type: 'Feature',
                    id: idOfMarks,
                    geometry: {
                        type: 'Point',
                        coordinates: carAccidents[i].coordinates
                    },
                    properties: {
                        balloonContentHeader:
                            'Данные аварии',
                        balloonContentBody:
                            '<font size=3><b>Погибшие: </b></font>' + carAccidents[i].fatalities + '<br>' + '<font size=3><b>Пострадавшие: </b></font>' + carAccidents[i].victims,
                    },
                    options: {
                        preset: presetPoint
                    }
                };
                idOfMarks += 1;
                tmp.push(item);
            }
            //console.log(tmp);
            objectManager.add(tmp);
            allRequiredMarksMap.set(region + year, tmp);
            console.log(allRequiredMarksMap);
        }
    });
    console.log('doneQuery');
}

//удаление меток по региону и году
function removeSearchByRegion() {
    let region = searchByRegion.value;
    let year = searchByYear.value;
    if (allRequiredMarksMap.has(region + year)) {
        console.log(allRequiredMarksMap.get(region + year));
        objectManager.remove(allRequiredMarksMap.get(region + year));
        allRequiredMarksMap.delete(region + year); //region и year -- это строки
    }
}

function postSendNumberOfAccidents() {
    let num = Number(firstNumberOfAccidents.value);
    axios.get('/post_first_searches', { params: { firstN: num } }).then(async function (response) {
        console.log(response.data);
        let tmp = new Map(); //копируем allRequiredMarksMap в tmp
        for (const [key, value] of allRequiredMarksMap.entries()) { //потому что позже мы этот мап удалим, чтобы заново всё отрисовать
            tmp.set(key, value);
        }
        console.log(tmp.size);
        console.log(tmp);
        if(tmp.size == 0) {
            return;
        }
        updateMap = true;
        objectManager.removeAll();
        allRequiredMarksMap.clear();
        //tmp.forEach(updateWholeMap);
        for (const [key, value] of tmp.entries()) { //потому что позже мы этот мап удалим, чтобы заново всё отрисовать
            updateRegion = key.substring(0, key.length - 4);
            updateYear = key.substring(key.length - 4, key.length);
            console.log(updateRegion, updateYear);
            await querySearchByRegion();
        }
        updateMap = false;
        console.log(tmp);
        console.log(allRequiredMarksMap);
    });
}

//запрос и отображене районов города
function showDistricts() {
    let cityName = chooseCitywithDistricts.value;
    console.log(cityName);
    if (allRequiredDistrictsMap.has(cityName)) {
        alert('Районы этого города уже показаны');
        return;
    }
    axios.get('/districts_coordinates', { params: { city: cityName } }).then(function(response) {
        let districtsNames = response.data[0];
        let districtsCoordinates = response.data[1];
        let tmp = [];
        //по массиву с районами
        for (let i = 0; i < districtsCoordinates.length; i++) {
            //по массивам подрайонов одного района (тип multipolygon)
            for (let j = 0; j < districtsCoordinates[i].length; j++) {
                //отдельно по каждой паре координат
                for (let k = 0; k < districtsCoordinates[i][j][0].length; k++) { //нулевое -- из-за странной лишней обёртки
                    let a = Number(districtsCoordinates[i][j][0][k][0]); //какая-то идейность с координатами, почему-то в файлах от
                    let b = Number(districtsCoordinates[i][j][0][k][1]); //заказчика перепутаны широта с долготой
                    districtsCoordinates[i][j][0][k][1] = a;
                    districtsCoordinates[i][j][0][k][0] = b;
                }
                //подумать над дизайном
                let item = new ymaps.Polygon([districtsCoordinates[i][j][0]], { balloonContentHeader: districtsNames[i], balloonContentBody: 'Тест' }, { fillOpacity: 0.5, strokeWidth: 1 });
                myMap.geoObjects.add(item);
                tmp.push(item);
            }
        }
        allRequiredDistrictsMap.set(cityName, tmp); 
    });
}

//вытаскиваем с сервера информацию по районам и считаем количество ДТП в каждом
//функция отрабатывает один раз, потому что это precalc
//результаты работы сохраняем в файлы
//файлы гоним на сервер
//оттуда вытаскиваем при новых запросах пользователей
async function showCityWithStatDistricts() {
    let cityName = cityWithStatDistricts.value;
    //объявим это всё заранее, потому что потом передадим на сервер
    let districtsNames = [];
    let districtsCoordinates = [];
    let accidentsArray = [];
    for(let year = 2016; year <= 2018; ++year) {
    //написано не очень оптимально, потому что нам не нужно несколько раз выгружать и заново создавать районы,
    //но т.к. это отработает один раз, то можно забить и переписать сильно позже
        await axios.get('/car_accident_in_region', { params: { regionName: cityName, year: year, n: 1 } }).then(async function (response1) {
            let carAccidents = response1.data;
            await axios.get('/districts_coordinates', { params: { city: cityName } }).then(function (response2) {
                districtsNames = response2.data[0];
                districtsCoordinates = response2.data[1];
                let districtsArray = []; //уже собранные в структуры районы
                //по массиву с районами
                for (let i = 0; i < districtsCoordinates.length; i++) {
                    let tmp = [];
                    //по массивам подрайонов одного района (тип multipolygon)
                    for (let j = 0; j < districtsCoordinates[i].length; j++) {
                        //отдельно по каждой паре координат
                        for (let k = 0; k < districtsCoordinates[i][j][0].length; k++) { //нулевое -- из-за странной лишней обёртки
                            let a = Number(districtsCoordinates[i][j][0][k][0]); //какая-то идейность с координатами, почему-то в файлах от
                            let b = Number(districtsCoordinates[i][j][0][k][1]); //заказчика перепутаны широта с долготой
                            districtsCoordinates[i][j][0][k][1] = a;
                            districtsCoordinates[i][j][0][k][0] = b;
                        }
                        //взято из документации API карт, без этого нельзя будет пользоваться функцией проверки
                        //принадлежности точки многоугольнику
                        var item = new ymaps.Polygon([
                           districtsCoordinates[i][j][0]
                        ]);
                        item.geometry.setMap(myMap);
                        item.options.setParent(myMap.options);
                        tmp.push(item);
                    }
                    districtsArray.push(tmp);
                    tmp = [];
                }
                //console.log(districtsArray);
                //console.log(districtsNames);
                let myMapStruct = new Map();
                //key -- название района
                //value -- все ДТП в нём
                for(let i = 0; i < districtsArray.length; ++i) {
                    let tmp = [];
                    for(let j = 0; j < districtsArray[i].length; ++j) {
                        for(let k = 0; k < carAccidents.length; ++k) {
                            if(districtsArray[i][j].geometry.contains(carAccidents[k].coordinates)) {
                                tmp.push(carAccidents[k]);
                            }
                        }
                    }
                    myMapStruct.set(districtsNames[i], tmp);
                    tmp = [];
                }
                console.log(myMapStruct);
                let tmp = [];
                for(const [key, value] of myMapStruct.entries()) {
                    tmp.push(value);
                }
                accidentsArray.push(tmp);
            });
        });
    }
    console.log(accidentsArray);
    console.log('flex');
    axios.post('/districts_save_data', 
    { 
        accidentsArray: accidentsArray, 
        districtsCoordinates: districtsCoordinates, 
        districtsNames: districtsNames, 
        cityName: cityName 
    }).then(function (response) {
        console.log(response.data);

    });
}

//удаление районов
function clearDistricts() {
    let cityName = chooseCitywithDistricts.value;
    if (allRequiredDistrictsMap.has(cityName)) {
        let tmp = allRequiredDistrictsMap.get(cityName);
        for(let i = 0; i < tmp.length; i++) {
            myMap.geoObjects.remove(tmp[i]);
        }
        allRequiredDistrictsMap.delete(cityName);
    }
}

//очистка всей карты
function clearWholeMap() {
    idOfMarks = 0;
    allRequiredMarksMap.clear();
    console.log(allRequiredMarksMap);
    allRequiredDistrictsMap.clear();
    objectManager.removeAll(); //тут лежат точки
    myMap.geoObjects.removeAll(); //а тут полигоны
    myMap.geoObjects.add(objectManager); //objectManager лежит в geoObjects
}