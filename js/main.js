//TO DO:  	
//			Add additional API and link
//Model
//Create a list of locations (schools) to display on the map
var Model =  {
	School: function(data) {
		var self = this;
		self.name = data.name;
		self.vicinity = data.vicinity;
		self.address = data.formatted_address;
		self.rating = data.rating;
		self.infowindow = {};
		self.marker = {};
		self.wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+
			self.name + '&prop=pageimages&format=json&callback=wikiCallback';
	}
}


 //ViewModel
var ViewModel = function() {                         
	var self = this,
	 	infowindow;

	self.init = function() {
		//References Google's API documentation
		function initialize() {
			var mapDetails = {
				center: {lat: 49.25707, lng: -123.1641735},
				zoom: 14
			}
			self.map = new google.maps.Map(document.getElementById('map'), mapDetails);

			infowindow = new google.maps.InfoWindow();

			var service = new google.maps.places.PlacesService(map);
			var request = {
				location: self.map.getCenter(),
				radius: '1500',
				keyword: ['schools']
			}
			service.nearbySearch(request, callback);	
		}

		function callback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				for (var i = 0; i < results.length; i++) {
					self.pushSchool(results[i]);
				}
			}
		}
		
		initialize();
	}

	self.schools = ko.observableArray();

	self.pushSchool = function(data) {
		var newSchool = new Model.School(data);
		self.schools.push(newSchool);
		self.createMarker(newSchool,data);
	};

	self.createMarker = function(school,place) {
		var placeLocation = place.geometry.location,
			marker = new google.maps.Marker({
				map: self.map,
				position: place.geometry.location,
				animation: google.maps.Animation.DROP,
				title: place.name
			});

		marker.addListener('click', function(){
			toggleBounce(school);
		});
		marker.setMap(self.map);
		school.marker = marker;
	}

	function toggleBounce(school) {
		if (school.marker.getAnimation() !== null) {
			school.marker.setAnimation(null);
		} else {
			$.ajax({
				url: school.wikiUrl,
				dataType: "jsonp",
				success: function(response) {
					infowindowMarker(school,response);
				},
				error: function() {
					infowindowMarker(school);
				}
			});								
		}
	}

	function infowindowMarker(school,response) {
			school.marker.setAnimation(google.maps.Animation.BOUNCE);
			var content = '<div><h6>' + school.name+'</h6></div>' +
				'<div>' + school.vicinity + '</div><br>';

			if (response) {
			var articleStr = response[1],
				description = response[2],
				url = 'http://en.wikipedia.org/wiki/' + articleStr;

			content = content + '<div>' + description + '</div>' +'<a target="_blank" href="' +
			 url +'">Wikipedia Article' + '</a>';	
			}
				
			infowindow.setContent(content)
			infowindow.open(self.map, school.marker);

			setTimeout(function(){
				school.marker.setAnimation(null)
			}, 2200);	
	}

	self.clickMarker = function(school) {
		toggleBounce(school);
	}

	self.query = ko.observable('');

	self.search = ko.computed(function(){
		var searchTerm = self.query().toLowerCase();
		if(!searchTerm) {
			return self.schools();
		} else {
			return ko.utils.arrayFilter(self.schools(), function(school) {
				var schoolLower = school.name.toLowerCase();
				if (schoolLower.search(searchTerm) >= 0) {
					school.visible = true;
					school.marker.setVisible(true);
					return true;
				} else {
					school.visible = false;
					school.marker.setVisible(false);
					return false;
				}
			})
		}
	}, self)
 
}


ko.applyBindings(ViewModel());
