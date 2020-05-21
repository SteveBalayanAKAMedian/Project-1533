let myMap;
let objectManager;
let result = []; //объекты внутри objectManager'a
let allRequiredRegions = [];
let idOfMarks = 0; //считаем айдишники всех меток для корректной работы 
let idOfPolygons = 0;

document.addEventListener('DOMContentLoaded', init);

//инициализация всего
//TODO -- 100500 кнопок переписать на нормальные менюшки
function init() {
    //проверка работы сервера
    let testServer = document.getElementById('testServer');
    testServer.addEventListener('click', () => {
        axios.get('/hello').then(function (response) {
            console.log(response);
            console.log('Server is on!');
        });
    });


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
    
    //тут для красоты
    searchByRegion.value= "Название региона";
    searchByYear.value= "Год поиска";
    let cityNameTextBox = false; //Если правда, то текст стирали, если ложь, то не стирали
    let yearNumberTextBox = false; //Если правда, то текст стирали, если ложь, то не стирали
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
    

    //запрашиваем у сервера данные для отображения
    btnSendSearchByRegion.addEventListener('click', querySearchByRegion);
    let chooseCitywithDistricts = document.getElementById('chooseCitywithDistricts');
    let showDistricts = document.getElementById('showDistricts');
    showDistricts.addEventListener('click', showAllDistricts)    
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
    if(region == '' || region == 'Название региона' || year == '' || year == 'Год поиска') { //чтобы не мучить сервер странными запросами, отсекаем на фронте их
        alert('Что-то не так с вашим запросом');
        return;
    }
    axios.get('/car_accident_in_region', { params: { regionName: region, year: year } }).then(function (response) {
        console.log(response);
        console.log(response.data.length);
        if (response.data.length === 0 || allRequiredRegions.find((element, index, array) => {
            return (array[index][0] === region && array[index][1] === year);
        })) {
            alert('Что-то не так с вашим запросом');
        }
        else {
            allRequiredRegions.push([region, year]);
            showAccidents(response.data, year);
        }
        console.log(allRequiredRegions);
    });
}


function showAccidents(carAccidents, year) {
    console.log(result);
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
        result.push(item);
    }
    console.log(result);
    objectManager.add(result);
}

function clearWholeMap() {
    idOfMarks = 0;
    result.splice(0, result.length);
    allRequiredRegions.splice(0, allRequiredRegions.length);
    console.log(result);
    console.log(allRequiredRegions);
    objectManager.removeAll(); //тут лежат точки
    myMap.geoObjects.removeAll(); //а тут полигоны
    myMap.geoObjects.add(objectManager); //objectManager лежит в geoObjects
}

function showAllDistricts() {
    let cityName = chooseCitywithDistricts.value;
    console.log(cityName);
    axios.get('/districts_coordinates', { params: { city: cityName } }).then(function(response) {
        let districtsNames = response.data[0];
        let districtsCoordinates = response.data[1];
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
                let item = new ymaps.Polygon([districtsCoordinates[i][j][0]], { balloonContent: districtsNames[i] }, { fillColor: "#00FF00", strokeWidth: 2 });
                myMap.geoObjects.add(item);
                console.log(districtsCoordinates[i][j][0]); 
            }
        } 
    });
}