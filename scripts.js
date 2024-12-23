let stateInfo;

const slider = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('year');
yearDisplay.innerHTML = slider.value;

let debounceTimeout;
let electionData;
let activeTab = 'president-tab';

slider.oninput = async function () {
    yearDisplay.innerHTML = this.value;
    // Clear the previous timeout
    clearTimeout(debounceTimeout);

    // Set a new timeout to call drawMap after a delay
    debounceTimeout = setTimeout(() => {
        drawMap(this.value);
    }, 200);
};

function updatePartyBar(republicanCount, democratCount) {
    console.log(republicanCount, democratCount);
    // Calculate total and percentages
    const total = republicanCount + democratCount;
    const republicanPercentage = (republicanCount / total) * 100;
    const democratPercentage = (democratCount / total) * 100;

    // Update the counts in the circles
    document.getElementById('republicanCount').innerText = republicanCount;
    document.getElementById('democratCount').innerText = democratCount;

    // Update the bar with the correct percentages
    document.querySelector('.republican-bar').style.width = `${republicanPercentage}%`;
    document.querySelector('.democrat-bar').style.width = `${democratPercentage}%`;
}

/// #########################################
/// ########## Show president data ##########
/// #########################################

async function showPresidentData() {
    activeTab = 'president-tab';
    document.getElementById('president-tab').classList.add('active');
    document.getElementById('senate-tab').classList.remove('active');
    document.getElementById('house-tab').classList.remove('active');
    electionData = await d3.json('./files/president_statelevel_1977-2025.json');
    drawMap();
}

async function filsterPresidentData() {
    // Filter data by the specified year
    const yearData = electionData.filter((entry) => entry.congress_began_year == yearDisplay.innerHTML);
    // Group data by state and find the winner in each state
    const stateWinners = yearData.reduce((acc, entry) => {
        // If the state is not already in the accumulator, add it
        if (!acc[entry.state]) {
            acc[entry.state] = { ...entry }; // Copy the entry to keep all its data
        } else {
            // If the state exists, check if the current entry has more votes than the stored entry
            if (entry.candidatevotes > acc[entry.state].candidatevotes) {
                acc[entry.state] = { ...entry }; // Update with the new winner
            }
        }
        return acc;
    }, {});

    // Convert the result to an array of objects for easier readability
    const result = Object.keys(stateWinners).map((state) => ({
        state,
        winner: stateWinners[state].party_detailed,
        total: stateWinners[state].totalvotes,
        votes: stateWinners[state].candidatevotes,
    }));

    // ### FOR progess bar ###
    let republicanCount = 0;
    let democratCount = 0;

    result.forEach((state) => {
        if (state.winner == 'REPUBLICAN') {
            republicanCount++;
        } else if (state.winner == 'DEMOCRAT') {
            democratCount++;
        }
    });

    updatePartyBar(republicanCount, democratCount);
    // ### ################
    return result;
}

/// #########################################
/// ########### Show Senate data ############
/// #########################################

async function showSenateData() {
    activeTab = 'senate-tab';
    document.getElementById('president-tab').classList.remove('active');
    document.getElementById('senate-tab').classList.add('active');
    document.getElementById('house-tab').classList.remove('active');
    electionData = await d3.json('./files/senate_1977-2025.json');
    drawMap();
}

async function filsterSenateData() {
    const yearData = await electionData.filter((entry) => entry.congress_began_year == yearDisplay.innerHTML);
    // Filter data by the specified year
    const groupedByState = yearData.reduce((acc, item) => {
        if (!acc[item.state]) {
            acc[item.state] = [];
        }
        acc[item.state].push(item);
        return acc;
    }, {});

    // ### FOR progess bar ###
    let republicanCount = 0;
    let democratCount = 0;

    yearData.forEach((senator) => {
        if (senator.party == 'REPUBLICAN') {
            republicanCount++;
        } else if (senator.party == 'DEMOCRAT') {
            democratCount++;
        }
    });

    updatePartyBar(republicanCount, democratCount);
    // ### ################
    return groupedByState;
}

/// #########################################
/// ############ Show house data ############
/// #########################################

async function showHouseData() {
    activeTab = 'house-tab';
    document.getElementById('president-tab').classList.remove('active');
    document.getElementById('senate-tab').classList.remove('active');
    document.getElementById('house-tab').classList.add('active');
    electionData = await d3.json('./files/house_of_representatives_1977-2025.json');
    drawMap();
}

async function filsterHouseData() {
    const yearData = electionData.filter((entry) => entry.congress_began_year == yearDisplay.innerHTML);
    console.log(yearData);

    // ### FOR progess bar ###
    let republicanCount = 0;
    let democratCount = 0;

    yearData.forEach((senator) => {
        if (senator.party == 'REPUBLICAN') {
            republicanCount++;
        } else if (senator.party == 'DEMOCRAT') {
            democratCount++;
        }
    });

    updatePartyBar(republicanCount, democratCount);
    // ### ################
    return yearData;
}

// ########################################
// ########################################
// ########################################

async function drawMap() {
    // Load the data file
    const us = await d3.json(
        './files/75faaaca1f1a4f415145b9db520349a3a0b93a53c1071346a30e6824586a7c251f45367d9262ed148b7a2b5c2694aa7703f3ac88051abc65066fd0074fdf9c9e.json'
    );

    ///##########
    // create a tooltip
    var Tooltip = d3
        .select('#chart')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('background-color', '#242424')
        .style('color', 'white')
        .style('padding', '15px')
        .style('border-radius', '10px');

    // ##########

    const width = 1075;
    const height = 710;
    let stateWins;

    if (activeTab == 'president-tab') {
        stateWins = await filsterPresidentData(yearDisplay.innerHTML);
    }
    if (activeTab == 'senate-tab') {
        stateWins = await filsterSenateData(yearDisplay.innerHTML);
    }
    if (activeTab == 'house-tab') {
        stateWins = await filsterHouseData(yearDisplay.innerHTML);
    }

    const zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', zoomed);

    // Clear the existing SVG content before redrawing
    d3.select('#chart').select('svg').remove();
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('width', width)
        .attr('height', height)
        .attr('style', 'max-width: 100%; height: auto;')
        .on('click', reset);

    const path = d3.geoPath();
    const g = svg.append('g');

    const states = g
        .append('g')
        .attr('fill', '#444') // Default color for uncolored states
        .attr('cursor', 'pointer')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.states).features)
        .join('path')
        .attr('d', path)
        .attr('fill', (d) => {
            let stateName = d.properties.name; // Get state name from GeoJSON properties

            //################ president-tab ################
            if (activeTab == 'president-tab') {
                const stateData = stateWins.find((state) => state.state.toLowerCase() == stateName.toLowerCase());
                if (stateData) {
                    return stateData.winner == 'DEMOCRAT' ? '#5fb7e5' : '#dc5356';
                }
            }
            //################ senate-tab ################
            if (activeTab == 'senate-tab') {
                if (stateName == 'West Virginia') {
                    stateName = 'Virginia';
                }
                const stateData = stateWins[stateName];
                if (!stateData) {
                    return '#444';
                }

                if (stateData[0].party === stateData[1].party) {
                    if (stateData[0].party == 'DEMOCRAT') {
                        return '#5fb7e5';
                    } else {
                        return '#dc5356';
                    }
                }

                if (stateData[0].party != stateData[1].party) {
                    return '#9e859e';
                }
            }
            //################ house-tab ################
            if (activeTab == 'house-tab') {
                const stateCounts = {};

                stateWins.forEach((entry) => {
                    if (!stateCounts[entry.state]) {
                        stateCounts[entry.state] = { republican: 0, democrat: 0 };
                    }

                    if (entry.party === 'REPUBLICAN') {
                        stateCounts[entry.state].republican++;
                    } else if (entry.party === 'DEMOCRAT') {
                        stateCounts[entry.state].democrat++;
                    }
                });

                // Get the counts for the specified state
                const counts = stateCounts[stateName];

                if (!counts) {
                    return '#444';
                }

                if (counts.republican > counts.democrat) {
                    return '#dc5356'; // Republican
                } else if (counts.democrat > counts.republican) {
                    return '#5fb7e5'; // Democrat
                } else {
                    return '#9e859e'; // Mixed
                }
            }

            return '#444'; // Default color if no match
        })
        .on('click', clicked)
        .on('mouseover', function (event, d) {
            Tooltip.style('opacity', 1); // Show tooltip on mouseover
        })
        .on('mousemove', function (event, d) {
            // Get state name from GeoJSON properties
            const stateName = d.properties.name;

            // Find the matching state data in `stateWins`
            const [x, y] = d3.pointer(event);
            const zoomTransform = d3.zoomTransform(this.parentNode);

            //################ president-tab ################
            if (activeTab == 'president-tab') {
                const stateData = stateWins.find((state) => state.state.toLowerCase() === stateName.toLowerCase());
                Tooltip.html(
                    stateData
                        ? `  ${stateData.winner === 'DEMOCRAT' ? '🔵' : '🔴'}  ${stateName} <br> Winner: ${stateData.winner} <br> Votes: ${stateData.votes}`
                        : `State: ${stateName} <br> No data available`
                )
                    .style('left', x * zoomTransform.k + zoomTransform.x - 100 + 'px')
                    .style('top', y * zoomTransform.k + zoomTransform.y + 120 + 'px');
            }
            //################ senate-tab ################
            if (activeTab == 'senate-tab') {
                if (stateName == 'West Virginia') {
                    stateName = 'Virginia';
                }
                const stateData = stateWins[stateName];

                Tooltip.html(
                    stateData
                        ? ` ${stateName} <br> ${stateData[0].party === 'DEMOCRAT' ? '🔵' : '🔴'}  ${stateData[0].senator} <br> ${
                            stateData[1].party === 'DEMOCRAT' ? '🔵' : '🔴'
                        }  ${stateData[1].senator}`
                        : `State: ${stateName} <br> No data available`
                )
                    .style('left', x * zoomTransform.k + zoomTransform.x - 100 + 'px')
                    .style('top', y * zoomTransform.k + zoomTransform.y + 120 + 'px');
            }
            //################ house-tab ################
            if (activeTab == 'house-tab') {
                const stateData = stateWins.filter((entry) => entry.state.toLowerCase() === stateName.toLowerCase());

                let republicanCount = 0;
                let democratCount = 0;

                stateData.forEach((entry) => {
                    if (entry.party === 'REPUBLICAN') {
                        republicanCount++;
                    } else if (entry.party === 'DEMOCRAT') {
                        democratCount++;
                    }
                });

                Tooltip.html(
                    stateData
                        ? `  ${stateName} <br>  🔴  ${republicanCount} representative <br>  🔵 ${democratCount} representative`
                        : `State: ${stateName} <br> No data available`
                )
                    .style('left', x * zoomTransform.k + zoomTransform.x - 100 + 'px')
                    .style('top', y * zoomTransform.k + zoomTransform.y + 120 + 'px');
            }
        })
        .on('mouseleave', function () {
            Tooltip.style('opacity', 0); // Hide tooltip on mouseleave
        })
        .attr('class', 'circle');

    states.append('title').text((d) => d.properties.name);

    g.append('path')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-linejoin', 'round')
        .attr('d', path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    svg.call(zoom);

    function reset() {
        states.transition().style('fill', null);
        svg
            .transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity, d3.zoomTransform(svg.node()).invert([width / 2, height / 2]));

        document.getElementById('state-name').innerText = 'Click on a state';
    }

    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        states.transition().style('fill', null);

        // Display the clicked state's name
        document.getElementById('state-name').innerText = `State: ${d.properties.name}`;

        d3.select(this).transition().style('fill', 'green');
        svg
            .transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg.node())
            );
    }

    function zoomed(event) {
        const { transform } = event;
        g.attr('transform', transform);
        g.attr('stroke-width', 1 / transform.k);
    }
}

// Run the function to draw the map
//drawMap();
showPresidentData();
