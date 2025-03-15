// Load the data for the Boxplot (socialMedia.csv)
const socialMedia = d3.csv("socialMedia.csv");

socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 40, right: 30, bottom: 50, left: 60},
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Create the SVG container for Boxplot
    const svg = d3.select("#boxplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.Likes), d3.max(data, d => d.Likes)])
        .nice()
        .range([height, 0]);

    // Add x and y axes to the SVG
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
       .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + margin.bottom - 10)
       .style("text-anchor", "middle")
       .text("Platform");

    // Add y-axis label
    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -height / 2)
       .attr("y", -margin.left + 10)
       .style("text-anchor", "middle")
       .text("Number of Likes");

    // Rollup function to compute quantiles for Boxplot
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return {min, q1, median, q3, max};
    };

    // uses d3.rollup() to group the data by species and apply a rollup function to 
    // calculate statistics for each group.
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // iterates over each species and species group to calculate the x-coordinate 
    // for each box in the boxplot.
    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform); // maps the value to the x coordinate
        const boxWidth = xScale.bandwidth(); // calculates the width of each box

        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black");

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "lightblue")
            .attr("stroke", "black");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "black");
    });
});

// Load the data for the Grouped Bar Chart (socialMediaAvg.csv)
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => d.AvgLikes = +d.AvgLikes);

    // Define the dimensions and margins for the SVG
    const margin = {top: 40, right: 150, bottom: 50, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container for Grouped Bar Chart
    const svg = d3.select("#barplot").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    const platforms = [...new Set(data.map(d => d.Platform))];
    const postTypes = [...new Set(data.map(d => d.PostType))];

    const x0 = d3.scaleBand()
          .domain(platforms)
          .range([0, width])
          .padding(0.2);

    const x1 = d3.scaleBand()
          .domain(postTypes)
          .range([0, x0.bandwidth()])
          .padding(0.05);

    const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.AvgLikes)])
          .nice()
          .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(postTypes)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add x and y axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add axis labels
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + 40)
       .attr("text-anchor", "middle")
       .text("Platform");

    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -height / 2)
       .attr("y", -40)
       .attr("text-anchor", "middle")
       .text("Average Likes");

    // Group container for bars
    const barGroups = svg.selectAll("bar")
      .data(platforms)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d)},0)`);

    // Draw bars
    barGroups.selectAll("rect")
      .data(d => data.filter(row => row.Platform === d))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.PostType))
      .attr("y", d => y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.AvgLikes))
      .attr("fill", d => color(d.PostType));

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${margin.top})`);

    postTypes.forEach((type, i) => {
      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .attr("alignment-baseline", "middle");

      legend.append("rect")
          .attr("x", 0)
          .attr("y", i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(type));
    });
});

// Load the data for the Time-series Line Chart (socialMediaTime.csv)
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers and parse the date
    const parseDate = d3.timeParse("%m/%d/%Y (%A)");  // Adjusted format to handle weekday
    data.forEach(function(d) {
        d.AvgLikes = +d.AvgLikes;
        d.Date = parseDate(d.Date); // Parsing the date using the updated format
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 40, right: 30, bottom: 50, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container for Time-series Line Chart
    const svg = d3.select("#lineplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    // Add x and y axes to the SVG
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + margin.bottom - 10)
       .style("text-anchor", "middle")
       .text("Date");

    // Add y-axis label
    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -height / 2)
       .attr("y", -margin.left + 10)
       .style("text-anchor", "middle")
       .text("Average Likes");

    // Create the line
    const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);

    // Add the line to the SVG
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);
});
