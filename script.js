ymaps.ready(init);

function init() {
	var myMap = new ymaps.Map(
			'map',
			{
				center: [55.76, 37.64],
				zoom: 5
			},
			{
				searchControlProvider: 'yandex#search'
			}
		),
		objectManager = new ymaps.ObjectManager({
			// Чтобы метки начали кластеризоваться, выставляем опцию.
			clusterize: true,
			// ObjectManager принимает те же опции, что и кластеризатор.
			gridSize: 32,
			clusterDisableClickZoom: true
		});

	// Чтобы задать опции одиночным объектам и кластерам,
	// обратимся к дочерним коллекциям ObjectManager.
	objectManager.objects.options.set('preset', 'islands#greenDotIcon');
	objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
	myMap.geoObjects.add(objectManager);

	// Запрашиваем данные ГИБДД
	$.ajax({
		url: '2016.json'
	}).done(function(data) {
		// Формируем объект для Я.Карт
		let result = [];
		// Параметр количества меток
		let objectsCount = 10000;
		for (let i = 0; i < objectsCount; i++) {
			let item = {
				type: 'Feature',
				id: i,
				geometry: {
					type: 'Point',
					coordinates: [Number(data[i].latitude), Number(data[i].longitude)]
				},
				properties: {
					balloonContentHeader:
						'<font size=3><b>Регион: </b></font>' + data[i].reg_name,
					balloonContentBody:
						'<font size=3><b>Местоположение: </b></font>' + data[i].address,
					balloonContentFooter:
						'<font size=3><b>Трасса/Дорога: </b></font>' + data[i].road_name,
					clusterCaption:
						'<font size=3><b>Тип аварии: </b></font>' + data[i].crash_type_name,
					hintContent: data[i].crash_reason
					}	
				};
			if(data[i].reg_name == "Москва") {	
				result.push(item);
			}
		}
		console.log('Данные для карт:', result);
		// Закидываем данные в Я.Карты
		objectManager.add(result);
	});
}
