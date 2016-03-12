function Point(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    this.zone1 = false;
    this.zone2 = false;
    this.zone3 = false;
}

Point.prototype.getLat = function() {
    return this.lat;
}

Point.prototype.getLng = function() {
    return this.lng;
}

Point.prototype.toString = function() {
    return this.lat + ',' + this.lng + ' - Zone1 : ' + this.zone1;
}

Point.prototype.isInZone1 = function() {
    return this.zone1;
}

Point.prototype.setInZone1 = function(isInZone) {
    this.zone1 = isInZone;
}

Point.prototype.isInZone2 = function() {
    return this.zone2;
}

Point.prototype.setInZone2 = function(isInZone) {
    this.zone2 = isInZone;
}

Point.prototype.isInZone3 = function() {
    return this.zone3;
}

Point.prototype.setInZone3 = function(isInZone) {
    this.zone3 = isInZone;
}

function drawCircle() {
    rosalysCircle = new google.maps.Circle({
        strokeOpacity: 0,
        fillOpacity: 0,
        map: map,
        center: map.getCenter(),
        radius: 10000
    });
}

function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 47.410272,
            lng: 0.980021
        },
        zoom: 11
    });

    drawCircle();

    destinations = [];
    points = [];
    var deltaLat = rosalysCircle.getBounds().getNorthEast().lat() - rosalysCircle.getBounds().getSouthWest().lat();
    var deltaLng = rosalysCircle.getBounds().getNorthEast().lng() - rosalysCircle.getBounds().getSouthWest().lng();

    console.log('Start area splitting');
    for (a = rosalysCircle.getBounds().getSouthWest().lat(); a <= rosalysCircle.getBounds().getNorthEast().lat(); a += (deltaLat / 30)) {
        for (b = rosalysCircle.getBounds().getSouthWest().lng(); b <= rosalysCircle.getBounds().getNorthEast().lng(); b += (deltaLng / 30)) {
            points.push(new Point(a, b));
            destinations.push({
                lat: a,
                lng: b
            });
        }
    }

    console.log(points.length + ' points generated'),


        distance = new google.maps.DistanceMatrixService;

    console.log('Getting distances and durations');
    getInZone(0);
}

function getInZone(a) {

    //Delay iteration
    setTimeout(function() {
        if (a < destinations.length) {
            var slice = destinations.slice(a, a + 25);
            distance.getDistanceMatrix({
                origins: [map.getCenter()],
                destinations: slice,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: true,
                avoidTolls: true
            }, function(response, status) {
                if (status !== google.maps.DistanceMatrixStatus.OK) {
                    console.log('distance : ' + status)
                } else {
                    results = response.rows[0].elements;
                    for (d = 0; d < results.length; d++) {
                        console.log('[' + (a+d) + '] ' + response.destinationAddresses[d] + ' : ' + results[d].distance.text + ',' + results[d].duration.text)
                        if ((results[d].distance.value / 1000 <= 5) && (results[d].duration.value / 60 <= 10)) {
                            points[a + d].setInZone1(true);
                        }
                        if ((results[d].distance.value / 1000 <= 10) && (results[d].duration.value / 60 <= 15)) {
                            points[a + d].setInZone2(true);
                        }
                        if ((results[d].distance.value / 1000 <= 15) && (results[d].duration.value / 60 <= 25)) {
                            points[a + d].setInZone3(true);
                        }
                    }
                }
                getInZone(a + 25);
            });
        } else {
            generateBounds();
        }
    }, 3000)
}

function generateBounds() {
    zone1Bounds = [];
    zone2Bounds = [];
    zone3Bounds = [];
    center = map.getCenter();
    var cLat = map.getCenter().lat();
    var cLng = map.getCenter().lng();

    console.log('Generating zones bounds');
    for (c = 0; c < points.length; c++) {
        if (points[c].isInZone1()) {
            zone1Bounds.push(new google.maps.LatLng(points[c].getLat(), points[c].getLng()));
        }
        if (points[c].isInZone2()) {
            zone2Bounds.push(new google.maps.LatLng(points[c].getLat(), points[c].getLng()));
        }
        if (points[c].isInZone3()) {
            zone3Bounds.push(new google.maps.LatLng(points[c].getLat(), points[c].getLng()));
        }
    }
    drawZone1();
}

function drawZone1() {
    console.log('Drawing polygon for zone 1');
    b = sortBounds(zone1Bounds);
    var zone1 = new google.maps.Polygon({
        paths: b,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4CAF50',
        fillOpacity: 0.6
    });
    zone1.setMap(map);
    drawZone2();
}

function drawZone2() {
    console.log('Drawing polygon for zone 2');
    b = sortBounds(zone2Bounds);
    var zone2 = new google.maps.Polygon({
        paths: b,
        strokeColor: '#FF9800',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF9800',
        fillOpacity: 0.4
    });
    zone2.setMap(map);
    drawZone3();
}

function drawZone3() {
    console.log('Drawing polygon for zone 3');
    b3 = sortBounds(zone3Bounds);
    var zone3 = new google.maps.Polygon({
        paths: b3,
        strokeColor: '#F44336',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#F44336',
        fillOpacity: 0.2
    });
    zone3.setMap(map);
}

function sortBounds(bounds) {
    var cLat = map.getCenter().lat();
    var cLng = map.getCenter().lng();
    var north = [];
    var south = [];

    /*
     To make the polygon, we'll start by the bounds the most at west from the northerns ones, then go east. For the southerns bounds, we go east to west*/
    for (z = 0; z < bounds.length; z++) {

        //Compare latitudes with center's one. Divide bounds by northerns and southerns
        if (bounds[z].lat() >= cLat) {
            north.push(bounds[z]);
        } else {
            south.push(bounds[z]);
        }
    }

    //First sort, by lattitudes
    north.sort(function(a, b) {
        if (a.lat() > b.lat()) {
            return -1;
        } else if (a.lat() < b.lat()) {
            return 1;
        } else {
            return 0;
        }
    });

    south.sort(function(a, b) {
        if (a.lat() > b.lat()) {
            return 1;
        } else if (a.lat() < b.lat()) {
            return -1;
        } else {
            return 0;
        }
    });

    //If two point on the same longittude, keep only the most northern
    //Since the bounds are sorted, the sub-array contain the northen ones.
    var northSorted = [];
    north.forEach(function(m) {
        var keep = true;
        northSorted.forEach(function(n) {
            if (m.lng() == n.lng()) {
                keep = false;
            }
        });

        if (keep) {
            northSorted.push(m);
        }
    });

    //If two point on the same longittude, keep only the most southern
    //Since the bounds are sorted, the sub-array contain the southern ones.
    var southSorted = [];
    south.forEach(function(o) {
        var keep = true;
        southSorted.forEach(function(p) {
            if (o.lng() == p.lng()) {
                keep = false;
            }
        });

        if (keep) {
            southSorted.push(o);
        }
    });

    //Sort by longitude. west to east
    northSorted.sort(function(a, b) {
        if (a.lng() > b.lng()) {
            return 1;
        } else if (a.lng() < b.lng()) {
            return -1;
        } else {
            return 0;
        }
    });

    //Sort by longitude. east to west
    southSorted.sort(function(a, b) {
        if (a.lng() > b.lng()) {
            return -1;
        } else if (a.lng() < b.lng()) {
            return 1;
        } else {
            return 0;
        }
    });

    //Fill the array for the polygon.
    var boundsToReturn = [];
    northSorted.forEach(function(m) {
        boundsToReturn.push(m);
    });

    southSorted.forEach(function(o) {
        boundsToReturn.push(o);
    });

    return boundsToReturn;
}