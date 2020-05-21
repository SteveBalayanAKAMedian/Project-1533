let myMap;
let objectManager;
let allRequiredMarksMap = new Map(); //объекты внутри objectManager'a
let idOfMarks = 0; //считаем айдишники всех меток для корректной работы
let allRequiredDistrictsMap = new Map();

document.addEventListener('DOMContentLoaded', init);

//инициализация всего
//TODO -- 100500 кнопок переписать на нормальные менюшки
//TODO -- переписать init, добавив много маленьких функций-инициализаторов, а то много и не оч понятно/приятно
//функция по размеру должна влезать на один экран
//у меня вот не влезла
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
function querySearchByRegion() {
    let region = searchByRegion.value;
    let year = searchByYear.value;
    if (allRequiredMarksMap.has(region + year)) {
        alert('Что-то не так с вашим запросом');
        return;
    }
    axios.get('/car_accident_in_region', { params: { regionName: region, year: year } }).then(function (response) {
        console.log(response);
        console.log(response.data.length);
        if (response.data.length === 0) {
            alert('Что-то не так с вашим запросом');
        }
        else {
            showAccidents(response.data, year);
        }
    });
}

//непосредственно отображение ДТП
function showAccidents(carAccidents, year) {
    let region = searchByRegion.value;
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
    console.log(tmp);
    objectManager.add(tmp);
    allRequiredMarksMap.set(region + year, tmp);
    console.log(allRequiredMarksMap.get(region + year));
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
    axios.get('/post_first_searches', { params: { firstN: num } }).then(function (response) {
        console.log(response.data);
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