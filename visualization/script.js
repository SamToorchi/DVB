/* jshint esversion: 6 */


// Dynamic width of Marey (left side Visualization) and Map (right side Visualization)
const window_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    window_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    marey_width = window_width * (2 / 3) - 20,
    map_width = window_width * (1 / 3);

// Global constants for Stylesheet rules (Defualts and changed)
const default_circle_radius = 3,
    augmented_circle_radius = 6,
    default_trippath_thickness = '1px',
    augmented_trippath_thickness = '3px';

// Time parser for the input data
var parseTime = d3.timeParse('%H:%M:%S');

// Handle mouse over a trip event
function tripMouseOver(tripId) {
    d3.selectAll(`path[data-trip-id='${tripId}']`)
        .style('stroke-width', augmented_trippath_thickness);

    d3.selectAll(`circle[data-trip-id='${tripId}']`)
        .style('r', augmented_circle_radius);
}

// Handle mouse out of a trip event
function tripMouseOut(tripId) {
    d3.selectAll(`path[data-trip-id='${tripId}']`)
        .style('stroke-width', default_trippath_thickness);

    d3.selectAll(`circle[data-trip-id='${tripId}']`)
        .style('r', default_circle_radius);
}

// Load the input data asynchronously
d3.queue()

    .defer(d3.json, 'data/61.json')
    .defer(d3.json, 'data/E63_1.json')
    .defer(d3.json, 'data/E63_2.json')
    .defer(d3.json, 'data/E63_3.json')
    .await((error, trainsData, vtn69Data, ret40Data, ret174Data) => {
        // Enrich bus datasets adding type to each trip, before concatenation
        vtn69Data = vtn69Data.map((t) => Object.assign(t, {
            type: 'vtn69'
        }));
        ret40Data = ret40Data.map((t) => Object.assign(t, {
            type: 'ret40'
        }));
        ret174Data = ret174Data.map((t) => Object.assign(t, {
            type: 'ret174'
        }));

        var timeDifference = [];
        //console.log(trainsData);
        for (var i = 0; i < trainsData.length; i++) {
            for (var j = 0; j < trainsData[i].stops.length; j++) {
                //console.log('erste Schleife');
                //console.log('zweite Schleife');
                var start = trainsData[i].stops[j].time;
                var end = trainsData[i].stops[j].realtime;

                start = start.split(":");
                end = end.split(":");


                var startDate = new Date(0, 0, 0, start[0], start[1], start[2]);
                var endDate = new Date(0, 0, 0, end[0], end[1], end[2]);

                var diff = endDate.getTime() - startDate.getTime();

                var hours = Math.floor(diff / 1000 / 60 / 60);
                diff -= hours * 1000 * 60 * 60;
                var minutes = Math.floor(diff / 1000 / 60);

                if (hours < 0) {
                    hours = hours + 1;
                }

                if (minutes == 59) {
                    minutes = 0;
                }
                if (minutes == 58) {
                    minutes = 0;
                }
                timeDifference = [{
                    diff_minute: minutes,
                    diff_hour: hours
            }];


                //var testOne = trainsData[i].stops[j];
                //console.log(trainsData[i].trip_id);
                //testOne.set([{"name": minutes}]);

                trainsData[i].stops[j]['diff_minute'] = minutes;
                trainsData[i].stops[j]['diff_hour'] = hours;
                trainsData[i].stops[j]['time_category'] = start[0];
                var recursiveMinutes;

                if (j == 0) {
                    recursiveMinutes = trainsData[i].stops[j].diff_minute;
                    trainsData[i].stops[j]['recursiveMinutes'] = recursiveMinutes;
                } else {
                    recursiveMinutes = trainsData[i].stops[j - 1].recursiveMinutes + trainsData[i].stops[j].diff_minute;
                    trainsData[i].stops[j]['recursiveMinutes'] = recursiveMinutes;
                }

                /**
            for(var k = 0; k < 24; k++){
                if("0"+k || k == trainsData[i].stops[j].time_category){
                }
            }
**/


            }

        }
        console.log(trainsData);





        // Concatenate all bus data in a single array
        var busData = vtn69Data.concat(ret40Data, ret174Data);

        // We use Immediately-Invoked Function Expressions (IIFE) to
        // scope locally the variables for the Marey diagram and the Map

        // Interactive map
        (function () {
            // Constants for the map
            const map_height = map_width,
                trips_spacing = 6;

            // List of stops divided in bus [0] and train [1] stops
            // From top to bottom and left to right
            var stops = [
            [
                'TU Dresden',
                'Studentenwerk',
                'Hauptbahnhof',
                'Wendeplatz'
            ],
            [
                'Löbtau',
                'Chemnitzer Straße',
                'Bernhardstraße',
                'Nürnberger Platz',
                'TU Dresden',
                'SLUB',
                'Zellescher Weg',
                'C.-D.-Friedrich Straße'
            ]
        ];

            // D3 margin convention
            var margin = {
                    top: 120,
                    right: 30,
                    bottom: 20,
                    left: 120
                },
                width = map_width - margin.left - margin.right,
                height = map_height - margin.top - margin.bottom;

            // Create main map SVG element applying the margins
            var svg = d3.select('body').append('svg')
                .attr('id', 'map')
                .style('margin-top', `-${map_height/2}px`)
                .style('left', `${marey_width}px`)
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom + 100)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            triangles = [];
            triangles.push({
                x: 25,
                y: -70,
                rotate: 180
            });
            triangles.push({
                x: -25,
                y: height + 30,
                rotate: 0
            });
            triangles.push({
                x: 25,
                y: height * 0.55,
                rotate: 90
            });
            triangles.push({
                x: width + 18,
                y: height - width / 1.5,
                rotate: 270
            });

            var arc = d3.symbol().type(d3.symbolTriangle);

            var line = svg.selectAll('path')
                .data(triangles)
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', 'black')
                .attr('stroke', 'black')
                .attr('stroke-width', 2)
                .attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ") rotate(" + d.rotate + ")";
                });

            // Scale for the the bus (y) axis (--> Map)
            var busScale = d3.scalePoint()
                .domain(stops[0])
                .range([0, width]);

            // Scale for the train (x) axis (--> Map)
            var trainScale = d3.scalePoint()
                .domain(stops[1])
                .range([-70, height]);

            // The y position of the train axis, which corresponds
            // to the position of the 'Delft' stop
            var busAxisYPos = trainScale('TU Dresden');

            // D3 Axes
            var busAxis = d3.axisTop(busScale).tickSize(0),
                trainAxis = d3.axisLeft(trainScale).tickSize(0);

            // Bus axis SVG element (horizontal)
            var busAxisEl = svg.append('g')
                .attr('class', 'bus axis')
                .call(busAxis)
                .attr('transform', `translate(0,${busAxisYPos})`);

            // Set text properties for bus axis
            busAxisEl.selectAll('text')
                .attr('y', 0)
                .attr('x', 9)
                .attr('dy', '.35em');

            // Place circles as ticks (css Class) in bus axis
            busAxisEl.selectAll('.tick')
                .each(function () {
                    d3.select(this)
                        .append('circle')
                        .attr('r', default_circle_radius);
                });

            // Train axis SVG element (vertical)
            var trainAxisEl = svg.append('g')
                .attr('class', 'train axis')
                .call(trainAxis);

            // Space labels of train axis
            trainAxisEl.selectAll('text')
                .attr('x', -15);

            // Place circles as ticks (css Class) in train axis
            trainAxisEl.selectAll('.tick')
                .each(function () {
                    d3.select(this)
                        .append('circle')
                        .attr('r', default_circle_radius)
                });


            // SVG group in which we place the train elements (group of circles)
            var trainsGroup = svg.append('g')
                .attr('class', 'trains');

            // SVG group in which we place the bus elements (group of circles)
            var busGroup = svg.append('g')
                .attr('class', 'buses');


            var trainDifference = svg.append('g')
                .attr('class', 'train_difference');


            // Given a time as Date object, renders the map corresponding
            // to that point in time
            function renderMapAtTime(actualTime) {
                // Verifies if a trip is active at the current time
                function active(trip) {


                    if (trip.stops[0].stop == "Löbtau" | trip.stops[0].stop == "C.-D.-Friedrich Straße") {
                        if (parseTime(trip.stops[0].time) < parseTime(trip.stops[0].realtime)) {
                            var startTime = parseTime(trip.stops[0].time);
                        } else {
                            var startTime = parseTime(trip.stops[0].realtime);
                            var startTime = d3.timeMinute.offset(startTime, -1);
                        }

                        var endTime = parseTime(trip.stops[trip.stops.length - 1].realtime);
                        var endTime = d3.timeSecond.offset(endTime, 20);

                    } else {
                        var startTime = parseTime(trip.stops[0].time);
                        var endTime = parseTime(trip.stops[trip.stops.length - 1].time);
                    }

                    return startTime < actualTime && actualTime < endTime;
                }

                // Filter the bus and train trips to keep only those that are active
                // in this point in time
                var activeTrainTrips = trainsData.filter(active);


                var activeBusTrips = busData.filter(active);


                // Given a list of stops and a scale, computes the position
                // of the vehicle
                function getPosition(tripStopList, scale) {




                    // Find which was the last stop of this trip
                    for (var i = 0; i < tripStopList.length - 1; i++) {
                        if (parseTime(tripStopList[i + 1].time) > actualTime) break;
                    }

                    // Use interpolation to compute current position of the vehicle
                    var lastStop = tripStopList[i],
                        nextStop = tripStopList[i + 1],
                        lastStopUnixTime = parseTime(lastStop.time).getTime(),
                        currentUnixTime = actualTime.getTime();

                    if (nextStop === undefined) {
                        var nextStopUnixTime = d3.timeMinute.offset(lastStopUnixTime, 10);
                        var varnextStop = lastStop.stop;
                    } else {
                        var nextStopUnixTime = parseTime(nextStop.time).getTime();
                        var varnextStop = nextStop.stop;
                    }
                    ratio = (currentUnixTime - lastStopUnixTime) / (nextStopUnixTime - lastStopUnixTime);

                    return scale(lastStop.stop) + ratio * (scale(varnextStop) - scale(lastStop.stop));
                }


                function getRealPosition(tripStopList, scale) {
                    // Find which was the last stop of this trip


                    for (var i = 0; i < tripStopList.length - 1; i++) {
                        if (parseTime(tripStopList[i + 1].realtime) > actualTime) break;
                    }



                    // Use interpolation to compute current position of the vehicle
                    var lastStop = tripStopList[i],
                        nextStop = tripStopList[i + 1],
                        lastStopUnixTime = parseTime(lastStop.realtime).getTime(),
                        currentUnixTime = actualTime.getTime();
                    if (nextStop === undefined) {
                        var nextStopUnixTime = d3.timeMinute.offset(lastStopUnixTime, 2);
                        var varnextStop = lastStop.stop;
                    } else {
                        var nextStopUnixTime = parseTime(nextStop.realtime).getTime();
                        var varnextStop = nextStop.stop;
                    }

                    ratio = (currentUnixTime - lastStopUnixTime) / (nextStopUnixTime - lastStopUnixTime);

                    return scale(lastStop.stop) + ratio * (scale(varnextStop) - scale(lastStop.stop));
                }

                // Create an array with the position of each active train trip
                var activeTrainPositions = activeTrainTrips.map((trip) => {
                    // Store the direction of the trip basing on the first stop
                    var direction = trip.stops[0].stop === 'C.-D.-Friedrich Straße' ? 'S' : 'N',
                        pos = getPosition(trip.stops, trainScale),
                        real_pos = getRealPosition(trip.stops, trainScale);


                    return {
                        pos: pos,
                        real_pos: real_pos,
                        direction: direction,
                        tripId: trip.trip_id
                    };
                });



                // Create an array with the position of each active bus trip
                var activeBusPositions = activeBusTrips.map((trip) => {
                    // Store the direction of the trip basing on the first stop
                    var direction = trip.stops[0].stop === 'TU Dresden' ? 'E' : 'W',
                        pos = getPosition(trip.stops, busScale);


                    return {
                        pos: pos,
                        direction: direction,
                        tripId: trip.trip_id,
                        type: trip.type
                    };
                });



                // Bind the circle elements to the active train trips, using as key
                // both the positions and the direction of the train
                var trains = trainsGroup.selectAll('.trains circle')
                    .data(activeTrainPositions, (p) => `${p.pos}|${p.direction}|${p.real_pos}`);

                /*
        var trainsRealTime = trainsGroup.selectAll('.trains circle')
        .data(activeTrainPositions, (q) => `${q.direction}|${q.real_pos}`);
        */

                //bind the line element to the active train trips
                var erzeuge = trainDifference.selectAll('.train_difference line')
                    .data(activeTrainPositions, (p) => `${p.pos}|${p.direction}|${p.real_pos}`);

                var trainsRealTime = trainDifference.selectAll('.train_difference circle')
                    .data(activeTrainPositions, (q) => `${q.direction}|${q.real_pos}`);



                //get SVG coordinates from every Array
                var TrainPathCordinates = activeTrainPositions.values();
                for (const value of TrainPathCordinates) {
                    pos = value.pos;
                    real_pos = value.real_pos;
                }


                //create line between circles
                erzeuge.enter().append('line')
                    .attr('x1', (p) => p.direction === 'N' ? trips_spacing : -trips_spacing)
                    .attr('x2', (p) => p.direction === 'N' ? trips_spacing : -trips_spacing)
                    .attr('y1', (p) => p.pos)
                    .attr('y2', (p) => p.real_pos)
                    .attr('stroke', 'red')
                    .attr("stroke-width", "1")
                    .attr('fill', 'black');
                erzeuge.exit().remove();

                // Enter event for the train trips.
                // Basing on the direction we choose a different visual offset
                // for the circle
                trains.enter().append('circle')
                    .attr('r', default_circle_radius)
                    .attr('data-trip-id', (p) => p.tripId)
                    .attr('cx', (p) => p.direction === 'N' ? trips_spacing : -trips_spacing)
                    .attr('cy', (p) => p.pos);


                // Exit event for the train trips
                trains.exit().remove();

                //create circles for real time
                trainsRealTime.enter().append('circle')
                    .attr('r', default_circle_radius)
                    .attr('data-trip-id', (q) => q.tripId)
                    .attr('cx', (q) => q.direction === 'N' ? trips_spacing : -trips_spacing)
                    .attr('cy', (q) => q.real_pos)
                    .attr('fill', 'red')
                    .attr('stroke-width', '2')
                    .attr('stroke', 'red');


                // Exit event for the train trips
                trainsRealTime.exit().remove();


                // Bind the circle elements to the active bus trips, using as key
                // both the position and the direction of the bus
                var buses = busGroup.selectAll('.buses circle')
                    .data(activeBusPositions, (p) => `${p.pos}|${p.direction}`);

                // Enter event for the bus trips.
                // Add the type of the trip as class so we can colour them differently
                buses.enter().append('circle')
                    .attr('r', default_circle_radius)
                    .attr('data-trip-id', (p) => p.tripId)
                    .attr('class', (p) => p.type)
                    .attr('cx', (p) => p.pos)
                    .attr('cy', (p) => p.direction === 'W' ? busAxisYPos - trips_spacing : busAxisYPos + trips_spacing);

                // Exit event for the bus trips
                buses.exit().remove();



                // Attach the trip mouseover and mouseout handlers to all the
                // circles representing the vehichles
                svg.selectAll('.trains circle, .buses circle')
                    .on('mouseover', (p) => tripMouseOver(p.tripId))
                    .on('mouseout', (p) => tripMouseOut(p.tripId));
            }
            /*******************************************/




            // Create a global Map object exposing the render function,
            // so that we can call it outside of the IIFE
            Map = {
                renderMapAtTime: renderMapAtTime
            };
        }());



        // Marey diagram
        function test(userinput, hoffe) {


            //console.log(typeof hoffe);
            // Constants for the Marey diagram
            const marey_height = 15000,
                yaxis_minutes_interval = 10,
                start_time = '05:00:00',
                end_time = '25:45:00',
                default_timeline_time = '05:01:00';

            // Used to remove the 'deduplicator' at the end of the stop name, if present
            var realStopName = (stop) => stop.indexOf('|') === -1 ? stop : stop.substring(0, stop.length - 2);

            // Used to get the 'deduplicated' bus stop name
            var deduplicatedBusStop = (stop, side) => stop === 'Wendeplatz' ? stop : `${stop}|${side}`;

            // Flattens an array ([[1,2],[3,4]] becomes [1,2,3,4])
            var flatten = (array) => [].concat.apply([], array);

            // List of the stops, divided in left, center and right,
            // bold lines
            var stops = [
            [
                'Löbtau',
                'Chemnitzer Straße',
                'Bernhardstraße',
                'Nürnberger Platz',
                'TU Dresden',
                'Studentenwerk',
                'Hauptbahnhof'
            ],
            [
                'Wendeplatz'
            ],
            [
                'Hauptbahnhof',
                'Studentenwerk',
                'TU Dresden',
                'SLUB',
                'Zellescher Weg',
                'C.-D.-Friedrich Straße'
            ]
        ];

            // Add '|A' to the stops to the left and '|B' to the stops to the right side of string,
            // because D3 doesn't like duplicate values in the scales.
            var stopsDeduplicated = [
            stops[0].map(s => s + '|A'),
            stops[1],
            stops[2].map(s => s + '|B')
        ];

            // Flatten the array with the stop names to use it as the x axis values
            var stopsDeduplicatedFlattened = flatten(stopsDeduplicated);

            // Time formatting for the y axis
            var formatAxisTime = d3.timeFormat('%H:%M');

            // Time formatting for the timeline tooltip
            var formatTimelineTime = d3.timeFormat('%H:%M:%S');

            // D3 margin convention
            var margin = {
                    top: 120,
                    right: 40,
                    bottom: 20,
                    left: 40
                },
                width = marey_width - margin.left - margin.right,
                height = marey_height - margin.top - margin.bottom;

            // Create main SVG element applying the margins
            var svg = d3.select('#mareydiv').append('svg')
                .attr('id', 'marey')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Create clip path so we're sure we don't draw out of the canvas
            // Add 5px from both the sides so that the circles can be seen fully
            svg.append('defs').append('clipPath')
                .attr('id', 'clip')
                .append('rect')
                .attr('x', -10)
                .attr('width', width + 20)
                .attr('height', height);

            var minUnixSeconds = parseTime(trainsData[0].stops[0].realtime);
            var maxUnixSeconds = parseTime(trainsData[trainsData.length / 2].stops[trainsData[trainsData.length / 2].stops.length - 1].realtime);

            var minUnixSecondsCordinate = Math.floor(new Date(minUnixSeconds) / 1000.0);
            var maxUnixSecondsCordinate = Math.floor(new Date(maxUnixSeconds) / 1000.0);


            /*tiny */

            var tinyMargin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            };
            var tinyOuterWidth = 80,
                tinyOuterHeight = 600;
            var tinyWidth = tinyOuterWidth - tinyMargin.left - tinyMargin.right,
                tinyHeight = tinyOuterHeight - tinyMargin.top - tinyMargin.bottom;


            // Create scale for x values (stops) using flattened array of deduplicated stops
            var xScale = d3.scalePoint()
                .domain(stopsDeduplicatedFlattened)
                .range([0, width]);


            // Create scale for y values (time) using the specified start and end time
            var yScale = d3.scaleTime()
                .domain([parseTime(start_time), parseTime(end_time)])
                .range([0, height]);

            var tinyxScale = d3.scalePoint()
                .domain(stopsDeduplicatedFlattened)
                .range([0, tinyWidth]);

            var tinyyScale = d3.scaleTime()
                .domain([parseTime(start_time), parseTime(end_time)])
                .range([0, tinyHeight]);

            // Default y coordinate for the timeline horizontal line
            const default_timeline_y = yScale(parseTime(default_timeline_time));

            // Create x axis using long ticks as vertical stop lines.
            // Remove the 'deduplicator' at the end of the stop in the axis labels if present
            var xAxis = d3.axisTop(xScale)
                .tickSize(-height)
                .tickFormat(realStopName);

            // Create left y axis
            var yLeftAxis = d3.axisLeft(yScale)
                .ticks(d3.timeMinute.every(yaxis_minutes_interval))
                .tickFormat(formatAxisTime);

            // Create right y axis
            var yRightAxis = d3.axisRight(yScale)
                .ticks(d3.timeMinute.every(yaxis_minutes_interval))
                .tickFormat(formatAxisTime);

            // Line generator for the path representing a trip
            var line = d3.line()
                .x(function (d) {
                    return xScale(d.stop);
                })
                .y(function (d) {
                    return yScale(parseTime(d.time));
                });

            var TinyLine = d3.line()
                .x(function (d) {
                    return tinyxScale(d.stop);
                })
                .y(function (d) {
                    return tinyyScale(parseTime(d.time));
                });

            // Draw the top x axis
            svg.append('g')
                .attr('class', 'x axis')
                .call(xAxis)
                .selectAll('text')
                .attr('y', 0)
                .attr('x', 9)
                .attr('dy', '.35em');

            // Draw left y axis
            svg.append('g')
                .attr('class', 'y left axis')
                .call(yLeftAxis);

            // Draw right y axis
            svg.append('g')
                .attr('class', 'y right axis')
                .attr('transform', `translate(${width},0)`)
                .call(yRightAxis);

            // Timeline group
            var timeline = svg.append('g')
                .attr('class', 'timeline')
                .attr('transform', `translate(0,${default_timeline_y})`);

            // Timeline horizontal line
            timeline.append('line')
                .attr('class', 'timeline')
                .attr('x1', 0)
                .attr('x2', width);

            // Timeline tooltip showing the time
            timeline.append('text')
                .text(default_timeline_time)
                .attr('x', '5')
                .attr('y', '-5');

            // Handle the mouse movement changing the timeline position
            function handleMouseMove() {
                var overlay = document.getElementById('overlay');

                // Get the mouse position relative to the overlay
                var yPos = d3.mouse(overlay)[1];
                // Keep an upper border for the timeline
                yPos = yPos < default_timeline_y ? default_timeline_y : yPos;
                // Get the time corresponding to the actual mouse position
                // and format it
                var time = yScale.invert(yPos),
                    formattedTime = formatTimelineTime(time);
                Map.renderMapAtTime(time);

                // Update the y position of the timeline group
                d3.select('g.timeline').attr('transform', `translate(0,${yPos})`);
                // Update the text showing the time
                d3.select('g.timeline text').text(formattedTime);
                /*
                    var tinyY = tinyyScale(time);
                    tinyBar.attr('transform', 'translate(0,' + tinyY + ')');
                    */
            }

            // Overlay used to register mouse movements
            svg.append('rect')
                .attr('id', 'overlay')
                .attr('width', width)
                .attr('height', height)
                .on('mousemove', handleMouseMove);

            var fiveClock = [];
            var sixClock = [];
            var sevenClock = [];
            var eightClock = [];
            var nineClock = [];
            var tenClock = [];
            var elevenClock = [];
            var twelveClock = [];
            var thirtheenClock = [];
            var fourtheenClock = [];
            var fiftheenClock = [];
            var sixtheenClock = [];
            var seventheenClock = [];
            var eighttheenClock = [];
            for (var i = 0; i < trainsData.length; i++) {

                var last = trainsData[i].stops.length;
                for (var j = 0; j < last; j++) {
                    last = last - 1;

                    if (5 == trainsData[i].stops[last].time_category) {
                        fiveClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumFive = 0;
                    for (var j = 0; j < fiveClock.length; j++) {
                        sumFive += fiveClock[j]
                    }

                    if (6 == trainsData[i].stops[last].time_category) {
                        sixClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumSix = 0;
                    for (var j = 0; j < sixClock.length; j++) {
                        sumSix += sixClock[j]
                    }

                    if (7 == trainsData[i].stops[last].time_category) {
                        sevenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumSeven = 0;
                    for (var j = 0; j < sevenClock.length; j++) {
                        sumSeven += sevenClock[j]
                    }

                    if (8 == trainsData[i].stops[last].time_category) {
                        eightClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumEight = 0;
                    for (var j = 0; j < eightClock.length; j++) {
                        sumEight += eightClock[j]
                    }

                    if (9 == trainsData[i].stops[last].time_category) {
                        nineClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumNine = 0;
                    for (var j = 0; j < nineClock.length; j++) {
                        sumNine += nineClock[j]
                    }


                    if (10 == trainsData[i].stops[last].time_category) {
                        tenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumTen = 0;
                    for (var j = 0; j < tenClock.length; j++) {
                        sumTen += tenClock[j]
                    }

                    if (11 == trainsData[i].stops[last].time_category) {
                        elevenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumEleven = 0;
                    for (var j = 0; j < elevenClock.length; j++) {
                        sumEleven += elevenClock[j]
                    }

                    if (12 == trainsData[i].stops[last].time_category) {
                        twelveClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumTwelve = 0;
                    for (var j = 0; j < twelveClock.length; j++) {
                        sumTwelve += twelveClock[j]
                    }

                    if (13 == trainsData[i].stops[last].time_category) {
                        thirtheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumThirtheen = 0;
                    for (var j = 0; j < thirtheenClock.length; j++) {
                        sumThirtheen += thirtheenClock[j]
                    }

                    if (14 == trainsData[i].stops[last].time_category) {
                        fourtheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumFourtheen = 0;
                    for (var j = 0; j < fourtheenClock.length; j++) {
                        sumFourtheen += fourtheenClock[j]
                    }

                    if (15 == trainsData[i].stops[last].time_category) {
                        fiftheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumFiftheen = 0;
                    for (var j = 0; j < fiftheenClock.length; j++) {
                        sumFiftheen += fiftheenClock[j]
                    }

                    if (16 == trainsData[i].stops[last].time_category) {
                        sixtheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumSixtheen = 0;
                    for (var j = 0; j < sixtheenClock.length; j++) {
                        sumSixtheen += sixtheenClock[j]
                    }

                    if (17 == trainsData[i].stops[last].time_category) {
                        seventheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumSeventheen = 0;
                    for (var j = 0; j < seventheenClock.length; j++) {
                        sumSeventheen += seventheenClock[j]
                    }

                    if (18 == trainsData[i].stops[last].time_category) {
                        eighttheenClock.push(trainsData[i].stops[last].recursiveMinutes);
                    }
                    var sumEighttheen = 0;
                    for (var j = 0; j < eighttheenClock.length; j++) {
                        sumEighttheen += eighttheenClock[j]
                    }
                }
            }
            
            var BarChartDatas = [
                {
                    x: 0,
                    y: 0
                },
                {
                    x: 1,
                    y: 0
                },
                {
                    x: 2,
                    y: 0
                },
                {
                    x: 3,
                    y: 0
                },
                {
                    x: 4,
                    y: 0
                },
                {
                    x: 5,
                    y: sumFive
                },
                {
                    x: 6,
                    y: sumSix
                },
                {
                    x: 7,
                    y: sumSeven
                },
                {
                    x: 8,
                    y: sumEight
                },
                {
                    x: 9,
                    y: sumNine
                },
                {
                    x: 10,
                    y: sumTen
                },
                {
                    x: 11,
                    y: sumEleven
                },
                {
                    x: 12,
                    y: sumTwelve
                },
                {
                    x: 13,
                    y: sumThirtheen
                },
                {
                    x: 14,
                    y: sumFourtheen
                },
                {
                    x: 15,
                    y: sumFiftheen
                },
                {
                    x: 16,
                    y: sumSixtheen
                },
                {
                    x: 17,
                    y: sumSeventheen
                },
                {
                    x: 18,
                    y: sumEighttheen
                }
];
            console.log(BarChartDatas);

            const marginBarchart = 60;
            const widthBarchart = 400;
            const heightBarchart = 500;

            var barchart = d3.select('#barchart').append('svg')
                .attr('class', 'barchart')
                .attr('clip-path', 'url(#clip)')
                .attr('width', widthBarchart)
                .attr('height', heightBarchart)
                .append('g')
                .attr('transform', `translate(160 ${marginBarchart}) rotate(90 200 200) `);


            var yBarScale = d3.scaleLinear()
                .range([heightBarchart, 0])
                .domain([0, 500]);

            barchart.append('g')
                .call(d3.axisLeft(yBarScale));

            var easyAccessForLoop = [];
            for (var i = 0; i < trainsData.length; i++) {
                for (var j = 0; j < trainsData[i].stops.length; j++) {
                    easyAccessForLoop.push(trainsData[i].stops[j]);
                }
            }
            console.log(easyAccessForLoop);

            const xBarScale = d3.scaleBand()
                .range([0, widthBarchart])
                .domain(BarChartDatas.map((t) => t.x))
                .padding(0.1)

            barchart.append('g')
                .attr('transform', `translate(0, ${heightBarchart})`)
                .call(d3.axisBottom(xBarScale));

            barchart.selectAll()
                .data(BarChartDatas)
                .enter()
                .append('rect')
                .attr('x', (t) => xBarScale(t.x))
                .attr('y', (t) => yBarScale(t.y))
                .attr('height', (t) => heightBarchart - yBarScale(t.y))
                .attr('width', xBarScale.bandwidth())
                .attr("fill", function (d) {
                    return d.diff_minute == 0 ? "#FF0033" : "#666666"
                });;


            var tinySvg = d3.select('#tinymarey').append('svg')
                .attr('class', 'tiny')
                .attr('clip-path', 'url(#clip)')
                .attr('width', tinyOuterWidth)
                .attr('height', tinyOuterHeight)
                .append('g')
                .attr('transform', 'translate(' + tinyMargin.left + ', ' + tinyMargin.top + ')')
                .selectAll('g')
                .data(trainsData)
                .enter()
                .append('g');

            var tinySvgBus = d3.select('#tinymarey').append('svg')
                .attr('class', 'tinyBus')
                .attr('clip-path', 'url(#clip)')
                .attr('width', tinyOuterWidth)
                .attr('height', tinyOuterHeight)
                .append('g')
                .attr('transform', 'translate(' + tinyMargin.left + ', ' + tinyMargin.top + ')')
                .selectAll('g')
                .data(busData)
                .enter()
                .append('g');

            tinySvg.append('path')
                .attr('d', (t) =>
                    TinyLine(t.stops
                        // Of all the stops in the trip, we only consider those
                        // that are on the left of the graph
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        // Then we add the 'deduplicator' for the left stops ('|A')
                        // to the stop names
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|A'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', 'red');

            tinySvg.append('path')
                .attr('d', (t) =>
                    TinyLine(t.stops
                        // Of all the stops in the trip, we only consider those
                        // that are on the left of the graph
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        // Then we add the 'deduplicator' for the left stops ('|A')
                        // to the stop names
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|A'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', '#303F9F');

            // Plot the part of the train trips to the right
            tinySvg.append('path')
                .attr('d', (t) =>
                    TinyLine(t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|B'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', 'red');

            // Plot the part of the train trips to the right for U
            tinySvg.append('path')
                .attr('stroke', '#303F9F')
                .attr('d', (t) =>
                    TinyLine(t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|B'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id);

            // Draw the bus trip paths on the left, adding the type of the trip as a class
            tinySvgBus.append('path')
                .attr('d', (t) => TinyLine(t.stops.map(s => ({
                    'time': s.time,
                    'stop': deduplicatedBusStop(s.stop, 'A')
                }))))
                .attr('class', (t) => t.type)
                .attr('data-trip-id', (t) => t.trip_id);


            // Create the group containing all the train trips
            var trains = svg.append('g')
                .attr('class', 'trip train')
                .attr('clip-path', 'url(#clip)')
                .selectAll('g')
                .data(trainsData)
                .enter().append('g');

            // Plot the part of the train trips to the left
            trains.append('path')
                .attr('d', (t) =>
                    line(t.stops
                        // Of all the stops in the trip, we only consider those
                        // that are on the left of the graph
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        // Then we add the 'deduplicator' for the left stops ('|A')
                        // to the stop names
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|A'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', 'red');

            // Plot the part of the train trips to the left for U
            trains.append('path')
                .attr('d', (t) =>
                    line(t.stops
                        // Of all the stops in the trip, we only consider those
                        // that are on the left of the graph
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        // Then we add the 'deduplicator' for the left stops ('|A')
                        // to the stop names
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|A'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', '#303F9F');

            // Plot the part of the train trips to the right
            trains.append('path')
                .attr('d', (t) =>
                    line(t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|B'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id)
                .attr('stroke', 'red');

            // Plot the part of the train trips to the right for U
            trains.append('path')
                .attr('stroke', '#303F9F')
                .attr('d', (t) =>
                    line(t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|B'
                        })))
                )
                .attr('data-trip-id', (t) => t.trip_id);


            // Draw the circles corresponding to the train stops
            trains.selectAll('circle')
                .data((t) => {
                    // For each trip, we need to add the deduplicator to the
                    // stop names so that xScale knows what we're talking about
                    var leftStops = t.stops
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'trip_id': t.trip_id,
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|A',
                            'realOrNot': 'real',
                            'color': 'red'
                        }));
                    var leftStopsU = t.stops
                        .filter(s => stops[0].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'trip_id': t.trip_id,
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|A',
                            'realOrNot': 'not',
                            'color': '#303F9F'
                        }));
                    var rightStops = t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'trip_id': t.trip_id,
                            'time': (userinput === hoffe) ? s.realtime : s.time,
                            'stop': s.stop + '|B',
                            'realOrNot': 'real',
                            'color': 'red'
                        }));
                    var rightStopsU = t.stops
                        .filter(s => stops[2].indexOf(s.stop) !== -1)
                        .map(s => ({
                            'trip_id': t.trip_id,
                            'time': (userinput === hoffe) ? s.time : s.realtime,
                            'stop': s.stop + '|B',
                            'realOrNot': 'not',
                            'color': '#303F9F'
                        }));
                    return leftStops.concat(rightStops, leftStopsU, rightStopsU);
                })

                .enter().append('circle')
                .attr('transform', (d) => `translate(${xScale(d.stop)},${yScale(parseTime(d.time))})`)
                .attr('r', default_circle_radius)
                .attr('fill', (d) => d.color)
                .attr('realOrNot', (d) => d.realOrNot)
                .attr('data-trip-id', (t) => t.trip_id);


            // Create groups containing the bus trips
            var buses = svg.append('g')
                .attr('class', 'trip bus')
                .attr('clip-path', 'url(#clip)')
                .selectAll('g')
                .data(busData)
                .enter().append('g');

            // Draw the bus trip paths on the left, adding the type of the trip as a class
            buses.append('path')
                .attr('d', (t) => line(t.stops.map(s => ({
                    'time': s.time,
                    'stop': deduplicatedBusStop(s.stop, 'A')
                }))))
                .attr('class', (t) => t.type)
                .attr('data-trip-id', (t) => t.trip_id);

            // Draw the bus trip paths on the right, adding the type of the trip as a class
            buses.append('path')
                .attr('d', (t) => line(t.stops.map(s => ({
                    'time': s.time,
                    'stop': deduplicatedBusStop(s.stop, 'B')
                }))))
                .attr('class', (t) => t.type)
                .attr('data-trip-id', (t) => t.trip_id);

            // Draw the circles representing the stops in a bus trip
            buses.selectAll('circle')
                .data((t) => {
                    // Add deduplicator to the stops on the left and right then merge them
                    var leftStops = t.stops.map(s => ({
                        'trip_id': t.trip_id,
                        'type': t.type,
                        'time': s.time,
                        'stop': deduplicatedBusStop(s.stop, 'A')
                    }));
                    var rightStops = t.stops.map(s => ({
                        'trip_id': t.trip_id,
                        'type': t.type,
                        'time': s.time,
                        'stop': deduplicatedBusStop(s.stop, 'B')
                    }));
                    return leftStops.concat(rightStops);
                })
                .enter().append('circle')
                .attr('transform', (d) => `translate(${xScale(d.stop)},${yScale(parseTime(d.time))})`)
                .attr('class', (t) => t.type)
                .attr('r', default_circle_radius)
                .attr('data-trip-id', (t) => t.trip_id);

            // Attach the trip mouseover and mouseout handlers to all the
            // paths and circles of the trips
            svg.selectAll('.trip path, .trip circle')
                .on('mouseover', (trip) => tripMouseOver(trip.trip_id))
                .on('mouseout', (trip) => tripMouseOut(trip.trip_id));



            d3.select("#marey").on('scroll', setScrollBox);
            d3.select("#tinymarey").on('click', setScroll);
            d3.select("#mareydiv").on('scroll', setBlackBoxPosition);


            var scrollToTinyScale = d3.scaleLinear()
                .domain([0, 15000])
                .range([0, tinyOuterHeight]);

            var scroll = d3.select('#tinymarey').select('.tiny').append('rect')
                .attr('class', 'scroll')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', tinyOuterWidth)
                .attr('height', scrollToTinyScale(tinyOuterHeight - 300));

            function setScrollBox(pos) {
                var top = document.getElementById('mareydiv').scrollTop;
                scroll.attr('y', scrollToTinyScale(pos));

            }

            function setScroll() {
                /* calculate click position relative to tinyMarey */
                var pos = d3.mouse(tinySvg.node());
                /*get y value */
                var y = pos[1];
                /*calculate height position of main marey **/
                var scrollPos = Math.max(scrollToTinyScale.invert(y) - tinyOuterHeight / 2, 0);
                document.getElementById('mareydiv').scrollTo(0, scrollPos);
                d3.select('.scroll').attr('y', y);
                d3.event.stopPropagation();

            }

            function setBlackBoxPosition() {
                /* get Scrollposition of Marey Diagram */
                var pos = document.getElementById('mareydiv').scrollTop;
                document.getElementById('mareydiv').scrollTop = pos;
                setScrollBox(pos);
                d3.event.stopPropagation();
            }

            setScrollBox(0);


        };
        test("realtime", "realtime");
        document.addEventListener('communication', function (event) {
            var userinput = event.detail;
            document.getElementById('marey').remove();
            test(userinput, "realtime");
        });

    });
