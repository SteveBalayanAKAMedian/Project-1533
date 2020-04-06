ymaps.ready(init);

function init() {
	var myMap = new ymaps.Map(
			'map',
			{
				center: [55.76, 37.64],
				zoom: 5
			}
		);
	objectManager = new ymaps.ObjectManager();

	$.getJSON('mo.json') .done(function(data) {
		for(var i = 0; i < 146; ++i) {
			var arr = data['features'][i]['geometry']['coordinates'];
			if(arr.length == 1) {
				for(let j = 0; j < arr[0].length; ++j) {
					arr[0][j][0] = Number(arr[0][j][0]);
					arr[0][j][1] = Number(arr[0][j][1]);
				}
				var Polygon = new ymaps.GeoObject({
					geometry: {
						type: "Polygon",
						coordinates: data[0],
						fillRule: "nonZero"
					},
					properties:{
						// Содержимое балуна.
						balloonContent: "Район"
					}
				}, {
					// Описываем опции геообъекта.
			// Цвет заливки.
					fillColor: '#00FF00',
			// Цвет обводки.
					strokeColor: '#0000FF',
			// Общая прозрачность (как для заливки, так и для обводки).
					opacity: 0.5,
			// Ширина обводки.
					strokeWidth: 5,
			// Стиль обводки.
					strokeStyle: 'shortdash'
				});
				objectManager.add(Polygon);
			}
		}
		console.log(objectManager);
		myMap.geoObjects.add(objectManager);
	}); 
		
	//datajson = datajson['responseJSON']; 
	/*let datajson;
	let req = new XMLHttpRequest();
	req.open('GET', 'mo.json');
	req.responseType = 'json';
	req.send();
	req.onload = function(datajson) {
		datajson = req.response;
	} */
	//console.log(datajson);
	//console.log(req);
	/*for(var i = 0; i < 146; ++i) {
		var arr = data['features'][i]['geometry']['coordinates'];
		if(arr.length == 1) {
			for(let j = 0; j < arr[0].length; ++j) {
				arr[0][j][0] = Number(arr[0][j][0]);
				arr[0][j][1] = Number(arr[0][j][1]);
			}
			var Polygon = new ymaps.GeoObject({
				geometry: {
					type: "Polygon",
					coordinates: data[0],
					fillRule: "nonZero"
				},
				properties:{
					// Содержимое балуна.
					balloonContent: "Район ебать"
				}
			}, {
				// Описываем опции геообъекта.
        // Цвет заливки.
        		fillColor: '#00FF00',
        // Цвет обводки.
        		strokeColor: '#0000FF',
        // Общая прозрачность (как для заливки, так и для обводки).
        		opacity: 0.5,
        // Ширина обводки.
        		strokeWidth: 5,
        // Стиль обводки.
        		strokeStyle: 'shortdash'
			});
			myMap.geoObjects.add(Polygon);
		}
	} */
}