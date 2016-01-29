//TO DO:  	Fix filtering
//			Add additional API and link
//			Set it so that if you click on the school in the side list the marker bounces

//Model

//Create a list of locations (schools) to display on the map
	var school = function(data) {
		var self = this;
		self.name = data.name
		self.address = data.formatted_address;
		self.rating = data.rating;
		self.infowindow = {};
		self.marker = {};
		self.schools = [];
	}


 //ViewModel
var ViewModel = function() {                         

	schools = ko.observableArray();

	self.pushSchool = function(school) {
		schools.push(school);
	};

	//filteredschools = ko.observableArray(schools);
	
	self.query = ko.observable('');

	self.search = ko.computed(function(){
		var searchTerm = self.query().toLowerCase();
		if(!searchTerm) {
			return schools();
		} else {
			return ko.utils.arrayFilter(schools(), function(school) {
				var schoolLower = school.name.toLowerCase();
				if (schoolLower.search(searchTerm) >= 0) {
					school.visible = true;
					return true;
				} else {
					school.visible = false;
					return false;
				}
			})
		}
	}, self)
 
	/*self.search = ko.computed(function() {
		return ko.utils.arrayFilter(schools(), function(school) {
			if (school.title.toLowerCase().indexof(self.query.toLowerCase()) >=0) {
				school.marker.setVisible(ture);
				return true;
			} else {
				school.marker.setVisible(false);
				return false;
			}
		})
	})*/

	console.log(schools);
	//console.log(filteredschools);
}

//App
var app = function() {

	return {

		init: function() {
			var map,
				marker,
				infowindow;

			//References Google's API documentation
			function initialize() {
				var mapDetails = {
					center: {lat: 49.25707, lng: -123.1641735},
					zoom: 14
				}
				map = new google.maps.Map(document.getElementById('map'), mapDetails);

				infowindow = new google.maps.InfoWindow();

				var service = new google.maps.places.PlacesService(map);
				var request = {
					location: map.getCenter(),
					radius: '1500',
					keyword: ['schools']
				}
				service.nearbySearch(request, callback);	
			}

			function callback(results, status) {
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					for (var i = 0; i < results.length; i++) {
						createMarker(results[i]);
						self.pushSchool(results[i]);
					}
				}
			}

			var createMarker = function(place) {
				var placeLocation = place.geometry.location;
				marker = new google.maps.Marker({
						map: map,
						position: place.geometry.location,
						animation: google.maps.Animation.DROP,
						title: place.name
					});
				marker.addListener('click', toggleBounce);
				marker.setMap(map);

				google.maps.event.addListener(marker, 'click', function() {
					infowindow.setContent('<div><h6>' + place.name+'</h6></div>' +
						'<div>' + place.vicinity + '</div>');
					infowindow.open(map,this);
				})
			
				function toggleBounce() {
					var self = this;
					if (this.getAnimation() !== null) {
						this.setAnimation(null);
					} else {
						this.setAnimation(google.maps.Animation.BOUNCE);
						setTimeout(function(){
							self.setAnimation(null)
						}, 1500);						
					}
				}
			}
			initialize();
		}

	}

}

ko.applyBindings(new ViewModel());
app = new app();




