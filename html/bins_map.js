// Markers and other controls are stored in the variables

// variable for map
var map;

// marker, info window variables
var anchor_marker;
var pop_marker;
var infowindow;

var markers = [];
var binLocs = [];

var startLat;
var startLng;

var defRoutes = [];
var optRoutes = [];

var numBins = 10;
var capacity = 50;
// variable for directions
var goog_geoCoder;
var goog_directionsService;
var goog_directionsDisplay;

var goog_renderers = [];
var defRenderer = [];
var optRenderer = [];

var opt_drawDefault = false;
var opt_drawOpt = false;

var opt_StartChanged = true;
var opt_capacityChanged = true;

var m_infowindow;

// random location generator
var locs_added = 0;

var input;
var searchBox;

// cache variables for the current values

var curLat;
var curLng;
var fitToBounds;
var curBounds;

// locations
var defaultLocation
var curLocation

// copied the icon from http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
var anchor_icon = 'blue-dot.png'
var pop_icon = 'red-dot.png'

var bin_30_icon = 'mm_20_red.png'
var bin_50_icon = 'mm_20_orange.png'
var bin_70_icon = 'mm_20_green.png'


// Initialize the main map
function initializeMap() {
    console.log("Initializing the map")

    // Create the SF map with the center of city as initial value
    var sfcity = new google.maps.LatLng(37.78, -122.454150)

    defaultLocation = new google.maps.LatLng(37.78, -122.454150)
    curLocation = new google.maps.LatLng(37.78, -122.454150)

    map = new google.maps.Map(document.getElementById('gmap-canvas'), {
        zoom: 13,
        center: defaultLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    index = 0;
    curRadius = 800;
    curCount = 10;
    curTypes = [];
    fitToBounds = true;

    // create all the google map services
    goog_geoCoder = new google.maps.Geocoder;
    goog_directionsService = new google.maps.DirectionsService;
    goog_directionsDisplay = new google.maps.DirectionsRenderer;

    goog_directionsDisplay.setMap(map);
    goog_directionsDisplay.setOptions({ suppressMarkers: true, preserveViewport: true });


    infowindow = new google.maps.InfoWindow;
    infowindow.setContent('San Francisco');

    m_infowindow = new google.maps.InfoWindow;

    // Anchor marker ... user's selection, or typed in the address bar

    anchor_marker = new google.maps.Marker({
        map: map,
        position: defaultLocation,
        icon: anchor_icon,
        draggable: true
    });

    input = document.getElementById('pac-input');
    searchBox = new google.maps.places.SearchBox(input, {});

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        var curloc = places[0].geometry.location
        var curlatlng = new google.maps.LatLng(curloc.lat(), curloc.lng());

        placeMarkerAndPanTo(curlatlng, map)

    });

    // Callbacks for anchor_marker
    google.maps.event.addListener(anchor_marker, 'click', function () {
        infowindow.open(anchor_marker.get('map'), anchor_marker);
    });

    google.maps.event.addListener(anchor_marker, 'dragend', function (event) {
        placeMarkerAndPanTo(event.latLng, map);
    });

    // Callback for selecting a location
    // Disbling click on the map as this causes too much confusion to the user
    // if he accidentaly clicks on map which clicking on a marker
    //map.addListener('click', function (e) {
    //    showInfo(e.latLng, map);
    //});

    // Place marker for the initial location
    placeMarkerAndPanTo(sfcity, map)
}


function setDefaultLocation() {
    map.setCenter(defaultLocation)
    setCurLocation(defaultLocation.lat, defaultLocation.lng)
    placeMarkerAndPanTo(defaultLocation, map)
}

function setCurLocation(lat, lng) {
    curLocation = new google.maps.LatLng(lat, lng);
}

function updateCurrentLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            map.setCenter(pos);
            placeMarkerAndPanTo(pos, map)
            setCurLocation(position.coords.latitude, position.coords.longitude);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}



function initializeApp() {
    initializeMap()

}


function popMarker(lat, lng) {
    var loc = new google.maps.LatLng(lat, lng)
    pop_marker.setPosition(loc);
    pop_marker.setVisible(true);
    m_infowindow.close();
    goog_directionsDisplay.setDirections({ routes: [] });
}


// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    goog_directionsDisplay.setDirections({ routes: [] });
    pop_marker.setVisible(false)
    clearMarkers();
    markers = [];
}

/*
function showInfo(latLng, map) {
    console.log(latLng.lat(), latLng.lng())
    var l1 = latLng.lat();
    var l2 = latLng.lng();

    goog_geoCoder.geocode({ 'location': latLng }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            console.log(results[0])
            console.log("The street number:", results[0].address_components[0].long_name)
            console.log(results[0].geometry.location.lat(), results[0].geometry.location.lng())
            console.log(results[0].geometry.location_type)
            if (results[0].geometry.location_type === 'ROOFTOP') {
                var r1 = results[0].geometry.location.lat();
                var r2 = results[0].geometry.location.lng();
                console.log("lat lng diffs: ", Math.abs(l1 - r1), Math.abs(l2 - r2))
            }
        }
    });

    anchor_marker.setPosition(latLng);
    //setCurLocation(latLng.lat(), latLng.lng())
    //map.fitBounds(circle_marker.getBounds());

    startLat = latLng.lat();
    startLng = latLng.lng();
    //doSearchAndUpdate()
}
*/

// Place the anchor_marker and pan to the location
function placeMarkerAndPanTo(latLng, map) {

    goog_geoCoder.geocode({
        'location': latLng
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[1]) {
                infowindow.setContent(results[1].formatted_address);
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });

    anchor_marker.setPosition(latLng);
    setCurLocation(latLng.lat(), latLng.lng())
        //map.fitBounds(circle_marker.getBounds());
    opt_StartChanged = true;
    startLat = latLng.lat();
    startLng = latLng.lng();
    map.panTo(latLng)
        //doSearchAndUpdate()
}

function addBinLocationMarker(Lat, Lng, capacity, address) {
    var loc = { lat: Lat, lng: Lng };
    var binicon
    if (capacity > 70) {
        binicon = bin_70_icon
    } else if (capacity > 50) {
        binicon = bin_50_icon
    } else {
        binicon = bin_30_icon
    }
    var marker = new google.maps.Marker({
        position: loc,
        map: map,
        icon: binicon,
        clickable: true
    });

    var bloc = { lat: Lat, lng: Lng, capacity: capacity, address: address }
    binLocs.push(bloc);

    google.maps.event.addListener(marker, 'click', function () {
        var htmlcontent = "<b>" + Lat + "</b>" + "<br>" + Lng + "<br><p>" + address + "<br>"
        htmlcontent = htmlcontent + capacity + "</p><br>"

        m_infowindow.setContent(htmlcontent)
        m_infowindow.open(map, marker)
    });

    markers.push(marker);
    return marker;
}

function validLatLng(lat, lng, capacity) {
    var latLng = { lat: lat, lng: lng };
    var res = false;

    goog_geoCoder.geocode({
        'location': latLng,
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0].geometry.location_type === 'ROOFTOP') {
                var rlat = results[0].geometry.location.lat();
                var rlng = results[0].geometry.location.lng();
                var latdiff = Math.abs(lat - rlat);
                var lngdiff = Math.abs(lng - rlng);
                if (latdiff < 0.001 && lngdiff < 0.001) {
                    addBinLocationMarker(lat, lng, capacity, results[0].formatted_address);
                }

            }
        } else {
            if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                console.log("Got OVER_QUERY_LIMIT")
            } else {
                console.log("The status is: ", status)
            }
        }
    });

}


function populateBinLocations(data) {
    binLocs = []
    for (var i = data.length - 1; i >= 0; i--) {
        addBinLocationMarker(data[i].LL.lat, data[i].LL.lng, data[i].capacity, "JUNLK")
    }
}

var tdata
var gdata

function testGoogJson() {
    $.getJSON('./googroute.json', function (data) {
        goog_directionsDisplay.setDirections(data)
    });
}


function testOptJson() {
    $.getJSON('./optroute.json', function (data) {
        goog_directionsDisplay.setDirections(data)
    });
}

function testTestJson() {
    $.getJSON('./testroute.json', function (data) {
        goog_directionsDisplay.setDirections(data)
        goog_directionsDisplay.setDirections(data)
    });
}

function testGoogleRoute() {
    var searchurl = 'https://maps.googleapis.com/maps/api/directions/json?origin="Milpitas,CA"&destination="San%20Jose,%20CA'

    $.ajax({
        type: 'GET',
        url: searchurl,
        data: {},
        dataType: 'json',
        success: function (data) {
            console.log(data)
            goog_directionsDisplay.setDirections(data[0])
            gdata = data
        },
        error: function () { alert('Error while getting random locations !!!'); }
    });
}

function testRoute() {

    var searchurl = "/testRoute";

    $.ajax({
        type: 'GET',
        url: searchurl,
        data: {},
        dataType: 'json',
        success: function (data) {
            console.log(data)
            goog_directionsDisplay.setDirections(data[0])
            tdata = data
        },
        error: function () { alert('Error while testRoute  !!!'); }
    });
}

function createRandomBins() {
    var curBounds = map.getBounds();
    var sw = curBounds.getSouthWest();
    var ne = curBounds.getNorthEast();

    var searchurl = "/getLocations/" + numBins + "/" + sw.lat() + "," + sw.lng() + "/" + ne.lat() + "," + ne.lng();

    $.ajax({
        type: 'GET',
        url: searchurl,
        data: {},
        dataType: 'json',
        success: function (data) {
            populateBinLocations(data)
        },
        error: function () { alert('Error while getting random locations !!!'); }
    });

}

function highlightOptRoute(i) {
    goog_directionsDisplay.setDirections(optRoutes[i])
}

function highlightDefRoute(i) {
    goog_directionsDisplay.setDirections(defRoutes[i])
}

function populateOptSegmentTable() {
    document.getElementById('segments').innerHTML = ""
    var innerhtml = "<tr><td></td></tr>";

    if (optRoutes.length > 0) {
        var dist = getOptDistance()
        innerhtml = "<tr><td><b>Total distance: " + dist / 1600 + " miles  </b></td></tr>"
        for (var i = 0; i < optRoutes.length; i++) {
            var r = optRoutes[i].routes[0].legs[0]
            innerhtml = innerhtml + "<tr" + ' onmouseover= highlightOptRoute(' + i + ')>'
            innerhtml = innerhtml + "<td style=\"line-height:1.75\">"
            innerhtml = innerhtml + "<span class=\"leftalign\">" + i + ". " + r.start_address + "</span>"
            innerhtml = innerhtml + "<span class=\"leftalign\">" + "   " + r.end_address + "</span>"
            innerhtml = innerhtml + "</td></tr>";
        }
    }

    if (optRoutes.length == 0) {
        innerhtml = "<p>" + "No results found !! " + "</p>";
    }

    document.getElementById('segments').innerHTML = innerhtml;
}


function populateDefaultSegmentTable() {
    document.getElementById('segments').innerHTML = ""
    var innerhtml = "<tr><td></td></tr>";

    if (defRoutes.length > 0) {
        var dist = getDefaultDistance()
        innerhtml = "<b>Total distance: " + dist / 1600 + " miles  </b>"

        for (var i = 0; i < defRoutes.length; i++) {
            var r = defRoutes[i].routes[0].legs[0]
            innerhtml = innerhtml + "<tr" + ' onmouseover= highlightDefRoute(' + i + ')>'
            innerhtml = innerhtml + "<td style=\"line-height:1.75\">"
            innerhtml = innerhtml + "<span class=\"leftalign\">" + i + ". " + r.start_address + "</span>"
            innerhtml = innerhtml + "<span class=\"leftalign\">" + "   " + r.end_address + "</span>"
            innerhtml = innerhtml + "</td></tr>";
        }
    }
    if (defRoutes.length == 0) {
        innerhtml = "<p>" + "No results found !! " + "</p>";
    }

    document.getElementById('segments').innerHTML = innerhtml;
}

function unhighlightRoute() {
    goog_directionsDisplay.setDirections({ routes: [] })
}

function showInfoWindow(id) {
    google.maps.event.trigger(markers[id], 'click');
}

// Functions for drawing and clearing off the Routes displayed
function hideDisplayedRoutes() {
    goog_directionsDisplay.setDirections({ routes: [] });
    hideDefaultRoutes()
    hideOptRoutes()
}

function hideDefaultRoutes() {
    for (var i = defRenderer.length - 1; i >= 0; i--) {
        defRenderer[i].setDirections({ routes: [] })
        defRenderer[i].setMap(null)
    }
}

function hideOptRoutes() {
    for (var i = optRenderer.length - 1; i >= 0; i--) {
        optRenderer[i].setDirections({ routes: [] })
        optRenderer[i].setMap(null)
    }
}

function displayDefaultRoutes() {
    if (defRoutes.length == 0) return;

    for (var i = defRoutes.length - 1; i >= 0; i--) {
        var r = defRenderer[i] = defRenderer[i] || new google.maps.DirectionsRenderer()
        r.setMap(map)
        r.setOptions({
            polylineOptions: { strokeColor: "green", strokeOpacity: 0.4, strokeWeight: 4 },
            suppressMarkers: true,
            preserveViewport: true
        });
        r.setDirections(defRoutes[i])
    }
}


function displayOptRoutes() {
    if (optRoutes.length == 0) {
        return;
    }
    for (var i = optRoutes.length - 1; i >= 0; i--) {
        var r = optRenderer[i] = optRenderer[i] || new google.maps.DirectionsRenderer()
        r.setMap(map)
        r.setOptions({
            polylineOptions: { strokeColor: "red", strokeOpacity: 0.4, strokeWeight: 4 },
            suppressMarkers: true,
            preserveViewport: true
        });
        r.setDirections(optRoutes[i])
    }
}

function drawOptRoutes() {
    if (opt_drawOpt) {
        displayOptRoutes()
    } else {
        hideOptRoutes()
    }
}

function drawDefaultRoutes() {
    if (opt_drawDefault) {
        displayDefaultRoutes()
    } else {
        hideDefaultRoutes()
    }
}


function calculateOptRoute(src, dest, i) {
    return new Promise(function (resolve, reject) {
        function run(src, dest, i) {
            goog_directionsService.route({
                origin: src,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (route, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    optRoutes[i] = route
                    resolve(route);
                } else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    setTimeout(function () {
                        run(src, dest, i);
                    }, 200);
                } else {
                    reject(status);
                }
            });
        }

        run(src, dest, i);
    });
}

function calculateDefRoute(src, dest, i) {
    return new Promise(function (resolve, reject) {
        function run(src, dest, i) {
            goog_directionsService.route({
                origin: src,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (route, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    defRoutes[i] = route
                    resolve(route);
                } else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    setTimeout(function () {
                        run(src, dest, i);
                    }, 200);
                } else {
                    reject(status);
                }
            });
        }

        run(src, dest, i);
    });
}


/*
var segcount = 0

function populateDefaultRoutes(data) {
    //var deferred = $.Deferred()
    return new Promise(function (resolve, reject) {
        function run(data) {
            hideOptRoutes()

            segcount = 0
            defRoutes = []

            for (var i = 0; i < data.length - 1; i++) {
                src = data[i].lat + "," + data[i].lng
                dest = data[i + 1].lat + "," + data[i + 1].lng

                var calcRoutesPromise = calculateDefRoute(src, dest, i)

                calcRoutesPromise.then(
                    function (r) {
                        segcount += 1
                        if (segcount === data.length - 1) {
                            resolve()
                        }
                    })

            }
        }
        run(data)
    });
    //  return deferred.promise()
}
*/

/*
function populateOptRoutes(data) {
    //var deferred = $.Deferred()
    return new Promise(function (resolve, reject) {
        function run(data) {
            hideOptRoutes()

            segcount = 0
            optRoutes = []

            for (var i = 0; i < data.length - 1; i++) {
                src = data[i].lat + "," + data[i].lng
                dest = data[i + 1].lat + "," + data[i + 1].lng

                var calcRoutesPromise = calculateOptRoute(src, dest, i)

                calcRoutesPromise.then(
                    function (r) {
                        segcount += 1
                        if (segcount === data.length - 1) {
                            resolve()
                        }
                    }
                )

            }
        }
        run(data);
    });

    //return deferred.promise()
}
*/

function populateOptRoutes(data) {

    return new Promise(function (resolve, reject) {
        function run(data) {
            hideOptRoutes()
            optRoutes = []
            var rPromises = []

            for (var i = 0; i < data.length - 1; i++) {
                src = data[i].lat + "," + data[i].lng
                dest = data[i + 1].lat + "," + data[i + 1].lng
                rPromises.push(calculateOptRoute(src, dest, i))
            }

            Promise.all(rPromises).then(function () {
                resolve()
            }).catch(function () { // if any image fails to load, then() is skipped and catch is called
                console.log("Caught an error while finding routes for opt routes")
            })
        }
        run(data);
    });

    //return deferred.promise()
}

function populateDefaultRoutes(data) {
    //var deferred = $.Deferred()
    return new Promise(function (resolve, reject) {
        function run(data) {
            hideDefaultRoutes()
            defRoutes = []
            var rPromises = []
            for (var i = 0; i < data.length - 1; i++) {
                src = data[i].lat + "," + data[i].lng
                dest = data[i + 1].lat + "," + data[i + 1].lng
                rPromises.push(calculateDefRoute(src, dest, i))
            }

            Promise.all(rPromises).then(function () {
                resolve()
            }).catch(function () { // if any image fails to load, then() is skipped and catch is called
                console.log("Caught an error while finding routes for opt routes")
            })
        }
        run(data)
    });
    //  return deferred.promise()
}

function getOptDistance() {
    var optDistance = 0
    for (var i = optRoutes.length - 1; i >= 0; i--) {
        optDistance += optRoutes[i].routes[0].legs[0].distance.value
    }
    return optDistance
}

function getDefaultDistance() {
    var defDistance = 0
    for (var i = defRoutes.length - 1; i >= 0; i--) {
        defDistance += defRoutes[i].routes[0].legs[0].distance.value
    }
    return defDistance
}

function calculateRouteStats() {
    console.log("I am in calculate Route stats")
    var optDistance = 0
    for (var i = optRoutes.length - 1; i >= 0; i--) {
        console.log("Opt: " + optRoutes[i].routes[0].legs[0].distance.value)
        optDistance += optRoutes[i].routes[0].legs[0].distance.value
    }
    console.log("Optimal Distance: " + optDistance)
    var defDistance = 0
    for (var i = defRoutes.length - 1; i >= 0; i--) {
        console.log("Def: " + defRoutes[i].routes[0].legs[0].distance.value)
        defDistance += defRoutes[i].routes[0].legs[0].distance.value
    }
    console.log("Default Distance: " + defDistance)
}

function findRoutes() {
    //var p1 = findOptRoutes()
    Promise.all([findOptRoutes(), findDefaultRoutes()]).then(function () {
        console.log("Finished both the routes")
        displayOptRoutes()
        populateOptSegmentTable()

        opt_capacityChanged = false
        opt_StartChanged = false

    })

}

function findDefaultRoutes() {
    return new Promise(function (resolve, reject) {
        function run() {
            if (opt_StartChanged) {

                //console.log("Started Default Routes: ", Date.now())
                var defRoutePromise = getDefaultRoutes()
                defRoutePromise.then(
                    function (r) {
                        //console.log("Finished Default Routes: ", Date.now())
                        resolve();
                    }
                )
            } else {
                resolve();
            }
        }
        run();
    })
}

function getDefaultRoutes() {
    return new Promise(function (resolve, reject) {
        function run() {
            var bins = 10;

            var locstr = startLat + "," + startLng
            var index = 0

            for (var i = binLocs.length - 1; i >= 0; i--) {
                locstr += "|" + binLocs[i].lat + "," + binLocs[i].lng
            }

            var searchurl = "/getRoute/" + locstr;

            $.ajax({
                type: 'GET',
                url: searchurl,
                data: {},
                dataType: 'json',
                success: function (data) {
                    var combinePromise = populateDefaultRoutes(data)
                    combinePromise.then(function (r) {
                        console.log("Finished populating Default routes")
                        resolve()
                    });
                },
                error: function () { alert('Error while getting the tour order !!!'); }
            });
        }
        run();
    })

}


function findOptRoutes() {
    return new Promise(function (resolve, reject) {
        function run() {
            if (opt_capacityChanged || opt_StartChanged) {
                //console.log("Started Opt Routes: ", Date.now())
                var optRoutePromise = getOptRoutes()
                optRoutePromise.then(
                    function (r) {
                        //console.log("Final Finished Opt Routes: ", Date.now())
                        resolve()
                    }
                )
            } else {
                resolve()
            }
        }
        run();
    })
}

function getOptRoutes() {
    return new Promise(function (resolve, reject) {
        function run() {
            var locstr = startLat + "," + startLng

            for (var i = binLocs.length - 1; i >= 0; i--) {
                if (binLocs[i].capacity > capacity) {
                    locstr += "|" + binLocs[i].lat + "," + binLocs[i].lng
                }
            }

            var searchurl = "/getRoute/" + locstr;

            $.ajax({
                type: 'GET',
                url: searchurl,
                data: {},
                dataType: 'json',
                success: function (data) {
                    var combinePromise = populateOptRoutes(data)
                    combinePromise.then(function (r) {
                        console.log("Finished populating opt routes")
                        resolve()
                    });
                },
                error: function () { alert('Error while getting the tour order !!!'); }
            });
        }
        run();
    })

}


document.getElementById('ddr').addEventListener('click', function (e) {
    opt_drawDefault = e.target.checked;
    drawDefaultRoutes()
}, false);


document.getElementById('dor').addEventListener('click', function (e) {
    opt_drawOpt = e.target.checked;
    drawOptRoutes()
}, false);

document.getElementById('segs').addEventListener('change', function (e) {
    
    if (e.target.value === "optroutes") {
        populateOptSegmentTable()
    } else {
        populateDefaultSegmentTable()
    }

}, false);

function binsCountUpdate(val) {
    document.querySelector('#bins').value = val;
    numBins = val;
}

function capacityUpdate(val) {
    document.querySelector('#caps').value = val;
    capacity = val;
    opt_capacityChanged = true;
}



// Initialize the google map on load
google.maps.event.addDomListener(window, 'load', initializeApp);
