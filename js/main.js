//Model
//Creates an object for school to store all needed attributes.
var Model =  {
	School: function(data) {
		var self = this;
		self.name = data.name;
		self.vicinity = data.vicinity;
		self.address = data.formatted_address;
		self.rating = data.rating;
		self.infowindow = {};
		self.marker = null;
		self.wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+
			self.name + '&prop=pageimages&format=json&callback=wikiCallback';
	}
};

//ViewModel
var ViewModel = function() {
	var self = this,
	 	infowindow;

	self.init = function() {
		//Create map using Google's Map API and load locations using Google Places Services
		function initialize() {
			var mapDetails = {
				center: {lat: 49.25707, lng: -123.1641735},
				zoom: 14,
				mapTypeControl: false
			};
			self.map = new google.maps.Map(document.getElementById('map'), mapDetails);

			infowindow = new google.maps.InfoWindow();

			var service = new google.maps.places.PlacesService(self.map);
			var request = {
				location: self.map.getCenter(),
				radius: '1500',
				keyword: ['schools']
			};
			service.nearbySearch(request, callback);	
		}

		function callback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				var arrayLength = results.length;
				for (var i = 0; i < arrayLength; i++) {
					self.pushSchool(results[i]);
				}
			}
		}
		
		initialize();
	};

	self.navVisible = ko.observable();

	self.toggleNav = function() {
		self.navVisible(!self.navVisible());
	};

	//Error message if Google API doesn't load
	self.googleError = function() {
		alert("Oops!  The Application failed to load.  Please refresh the page.");
	};
	
	self.schools = ko.observableArray();

	//Creates a new School for each result from Google, adds it to the schools
	//array and creates a marker.
	self.pushSchool = function(data) {
		var newSchool = new Model.School(data);
		self.schools.push(newSchool);
		self.createMarker(newSchool,data);
	};

	//Creates marker with an event listener to run toggleBounce and sets marker on map
	self.createMarker = function(school,place) {
		var marker = new google.maps.Marker({
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
	};

	//Attempts to pull in data from Wikipedia, if successful it passes both the 
	//response and school to infowindowMarker, otherwise it simply passes the school.
	//This way the user wouldn't be aware if the Wikipedia API failed.
	function toggleBounce(school) {
		if (school.marker.getAnimation() !== null) {
			school.marker.setAnimation(null);
		} else {
			$.ajax({
				url: school.wikiUrl,
				dataType: 'jsonp',
				done: function(response) {
					infowindowMarker(school,response);
				},
				fail: function() {
					infowindowMarker(school);
					alert("Oops!  The Wikipedia content failed to load.  Please refresh the page.");
				}
			});
		}
	}

	//Animates the marker and creates the infowindow, only including Wikipedia
	//results if a response is passed through.
	function infowindowMarker(school,response) {
			school.marker.setAnimation(google.maps.Animation.BOUNCE);
			var content = '<div><h4>' + school.name+'</h4></div>' +
				'<div><h6>' + school.vicinity + '</h6></div>';

			if (response) {
			var articleStr = response[1],
				description = response[2],
				url = 'http://en.wikipedia.org/wiki/' + articleStr;

			content = content + '<div>' + description + '</div>' +'<a target="_blank" href="' +
			 url +'">Wikipedia Article' + '</a>';	
			}
				
			infowindow.setContent(content);
			infowindow.open(self.map, school.marker);

			setTimeout(function(){
				school.marker.setAnimation(null);
			}, 2200);	
	}

	//Calls toggleBounce if the school name is clicked in the list
	self.clickMarker = function(school) {
		toggleBounce(school);
	};

	self.query = ko.observable('');

	//Filters the schools list to only include matching values typed in the search
	//bar.  Hides/shows the associated marker as applicable.
	self.search = ko.computed(function(){
		var searchTerm = self.query().toLowerCase();
		return ko.utils.arrayFilter(self.schools(), function(school) {
			var schoolLower = school.name.toLowerCase();
			if (!searchTerm || schoolLower.search(searchTerm) >= 0) {
				school.visible = true;
				if(school.marker) {
					school.marker.setVisible(true);
				}
				return true;
			} else {
				school.visible = false;
				if(school.marker) {
					school.marker.setVisible(false);	
				}
				return false;
			}
		});
	}, self);
 
};

ko.applyBindings(ViewModel());
