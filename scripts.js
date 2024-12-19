
    let stateInfo;
    const slider = document.getElementById('yearSlider');
    const yearDisplay = document.getElementById('year');
    let debounceTimeout;
    yearDisplay.innerHTML = slider.value;
    let electionData;
    let activeTab = 'president-tab';

    slider.oninput = async function () {
        yearDisplay.innerHTML = this.value;
    // Clear the previous timeout
    clearTimeout(debounceTimeout);

    // Set a new timeout to call drawMap after a delay
    debounceTimeout = setTimeout(() => {
    console.log('DRAW MAP ');
    drawMap(this.value);
}, 200); // 200ms delay (adjust as needed)
};



    async function showPresidentData(){
        console.log('test 1')
        activeTab = 'president-tab';
        document.getElementById('president-tab').classList.add('active');
        document.getElementById('senate-tab').classList.remove('active');
        document.getElementById('house-tab').classList.remove('active');
         electionData = await d3.json('./files/president_statelevel_1977-2025.json');
        console.log('electionData', electionData);
        drawMap();
        //getStateWinners(year);
    }
    async function showSenateData(){
        console.log('test 2')
        activeTab = 'senate-tab';
        document.getElementById('president-tab').classList.remove('active');
        document.getElementById('senate-tab').classList.add('active');
        document.getElementById('house-tab').classList.remove('active');
         electionData = await d3.json('./files/senate_1977-2025.json');
        console.log('electionData', electionData);
        drawMap();
        //getStateWinners(year);
    }
    async function showHouseData(){
        console.log('test 3')
        activeTab = 'house-tab';
        document.getElementById('president-tab').classList.remove('active');
        document.getElementById('senate-tab').classList.remove('active');
        document.getElementById('house-tab').classList.add('active');
         electionData = await d3.json('./files/house_of_representatives_1977-2025.json');
        console.log('electionData', electionData);
        drawMap();
        //getStateWinners(year);
    }


    async function getStateWinners(year) {
    console.log('test 4', year);
        //const electionData = await d3.json('./files/president_statelevel_1977-2025.json');
    console.log('electionData', electionData);
    // Filter data by the specified year
    // Filter data by the specified year
    const yearData = electionData.filter((entry) => entry.congress_began_year == year);

    console.log('yearData', yearData);

    // Group data by state and find the winner in each state
    const stateWinners = yearData.reduce((acc, entry) => {
    // If the state is not already in the accumulator, add it
    if (!acc[entry.state]) {
    acc[entry.state] = { ...entry }; // Copy the entry to keep all its data
} else {
        // if we are useing PresidentData
        if(activeTab == 'president-tab'){
            console.log('USE PRESIDENT DATA YO');
            // If the state exists, check if the current entry has more votes than the stored entry
            if (entry.candidatevotes > acc[entry.state].candidatevotes) {
                acc[entry.state] = { ...entry }; // Update with the new winner
            }
        }

        // if we are useing PresidentData
        if(activeTab == 'senate-tab'){
            console.log('USE PRESIDENT DATA YO');
            // If the state exists, check if the current entry has more votes than the stored entry
           // if (entry.position > acc[entry.state].position) {
                //acc[entry.state] = { ...entry }; // Update with the new winner
            //}

        }

        // if we are useing PresidentData
        if(activeTab == 'house-tab'){
            console.log('USE PRESIDENT DATA YO');
            // If the state exists, check if the current entry has more votes than the stored entry
            if (entry.candidatevotes > acc[entry.state].candidatevotes) {
                acc[entry.state] = { ...entry }; // Update with the new winner
            }
        }
}
    return acc;
}, {});


    console.log('### stateWinners ###',stateWinners)

        if(activeTab == 'president-tab'){
            // Convert the result to an array of objects for easier readability
            const result = Object.keys(stateWinners).map((state) => ({
                state,
                winner: stateWinners[state].party_detailed,
                total: stateWinners[state].totalvotes,
                votes: stateWinners[state].candidatevotes,

            }));

            return result;
        }

        if(activeTab == 'senate-tab'){
            // Convert the result to an array of objects for easier readability
            const result = Object.keys(stateWinners).map((state) => ({
                state,
                winner: stateWinners[state].party,
                position: stateWinners[state].position,

            }));

            return result;
        }

}

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
    const stateWins = await getStateWinners(yearDisplay.innerHTML, electionData);
    //console.log('¤¤¤¤¤¤¤¤', year);
    //    console.log('¤¤¤¤¤¤¤¤', stateWins);
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
    const stateName = d.properties.name; // Get state name from GeoJSON properties
       // console.log('test23', stateName);
        const stateData = stateWins.find((state) => state.state.toLowerCase() == stateName.toLowerCase());
       // console.log('test54', stateData);

    if (stateData) {
    return stateData.winner == 'DEMOCRAT' ? '#5fb7e5' : '#dc5356';
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
    const stateData = stateWins.find((state) => state.state.toLowerCase() === stateName.toLowerCase());
    const [x, y] = d3.pointer(event);
    const zoomTransform = d3.zoomTransform(this.parentNode);
    // Update the tooltip content with state data if available
    if (activeTab == 'president-tab') {
        Tooltip.html(
            stateData
                ? `  ${stateData.winner === 'DEMOCRAT' ? '🔵' : '🔴'}  ${stateData.state} <br> Winner: ${stateData.winner} <br> Votes: ${
                    stateData.votes
                }`
                : `State: ${stateName} <br> No data available`
        )
            .style('left', x * zoomTransform.k + zoomTransform.x + 'px') // Adjust for scale and translation
            .style('top', y * zoomTransform.k + zoomTransform.y + 'px');
    }

        if (activeTab == 'senate-tab') {
            Tooltip.html(
                stateData
                    ? `  ${stateData.winner === 'DEMOCRAT' ? '🔵' : '🔴'}  ${stateData.state} <br> Winner: ${stateData.winner} <br> Position: ${
                        stateData.position
                    }`
                    : `State: ${stateName} <br> No data available`
            )
                .style('left', x * zoomTransform.k + zoomTransform.x + 'px') // Adjust for scale and translation
                .style('top', y * zoomTransform.k + zoomTransform.y + 'px');
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