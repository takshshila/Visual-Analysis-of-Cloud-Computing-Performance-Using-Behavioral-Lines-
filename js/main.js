METRIC_CPU = "CPU"
const e = 2.71828;
userSelectedA = 3; // two 5 minutes
userSelectedNode = "node5";
var coeff = 1000 * 60;
metricsAndFilePaths = {
    "CPU": "./../data/cpu_p.csv",
    "DISK": "./../data/disk_p.csv",
    "MEMORY": "./../data/memory_p.csv",
    "NETWORK": "./../data/network_p.csv"
}
METRICS = []
extent = []
minTimeStamp = null
maxTimeStamp = null;
behavioral_chart_data = {}
behavioral_lines_chart_data = {}
margin = {
    top: 20,
    right: 20,
    bottom: 35,
    left: 10
}
TOTAL_NUMBER_OF_NODES = 0
const strokeWidth = 1.5;
extent = []
enableBrush = false;
var behavioraltoolTip = null;
extent = [new Date("Sun Aug 07 2022 09:25:00 GMT-0700 (Mountain Standard Time)").toString(), new Date("Sun Aug 07 2022 09:45:00 GMT-0700 (Mountain Standard Time)").toString()]

addEventListener("resize", (event) => {
    buildStackedAreaChart();
    setTimeout(() => {
        if(extent.length == 0){
            // document.getElementById("graph_svg").style.display = "none";
            // document.getElementById("graph_svg").style.display = "inherit";
            // document.getElementById("left-line-chart").classList.remove("col-12");
            // document.getElementById("left-line-chart").classList.add("col-6");
            times = Object.keys(stacked_area_chart_data);
        }else{
            times = extent;
        }
        drawBehavioralLines([times[0], times[times.length - 1]]);
        removeLoader();
    }, 1000);
    showLoader();
});

function hideDetailedCharts(){
    document.getElementById("graph_svg").style.display = "none";
    document.getElementById("left-line-chart").classList.remove("col-6");
    document.getElementById("left-line-chart").classList.add("col-12");
    enableBrush = false;
}

function unhideDetailedCharts(){
    document.getElementById("graph_svg").style.display = "inherit";
    document.getElementById("left-line-chart").classList.remove("col-12");
    document.getElementById("left-line-chart").classList.add("col-6");
    enableBrush = true;
}

function resetTheVisualization(){
    hideDetailedCharts();
    document.getElementById('useSelectedA').value = "3";
    document.getElementById('userSelectedNode').value = "5";
    setTimeout(() => {
        if(extent.length == 0){
            times = Object.keys(stacked_area_chart_data);
        }else{
            times = extent;
        }
        drawBehavioralLines([times[0], times[times.length - 1]]);
        updateChart();
        removeLoader();
    }, 1000);
    showLoader();
}

/* 
    Perform precomputation:
    Algo: 
        Take a metric A.
        sum = Do the sum all nodes metric A value at given timestamp
        compute average and this is our one metric height
        likewise compute it for all metric at a given point of time.

    After preprocessing data looks like:
        [
            {
                "timestamp": 1111111,
                "metric1AverageValue": 0.4,
                "metric2AverageValue": 0.3
            },
            {
                "timestamp": 1111111,
                "metric1AverageValue": 0.4,
                "metric2AverageValue": 0.3
            }
        ]
*/
document.addEventListener('DOMContentLoaded', async function () {
    stacked_area_chart_data = {}
    // this is just for cpu metrics - like this do it for all the metrics.
    Promise.all(Object.values(metricsAndFilePaths).map(d => d3.csv(d))).then(values => {
        METRICS = Object.keys(metricsAndFilePaths)
        values.forEach((data, index) => {
            TOTAL_NUMBER_OF_NODES = data.columns.length - 1; // -1 for removing timestamp
            data.forEach(currentTimeStampValues => {
                // data gathering for stackedAreaChart
                timestamp = getDateAndTime(currentTimeStampValues.timestamp);
                // timestamp = parseTime(currentTimeStampValues.timestamp)
                if (!stacked_area_chart_data.hasOwnProperty(timestamp)) {
                    stacked_area_chart_data[timestamp] = {}
                }
                stacked_area_chart_data[timestamp]["timestamp"] = timestamp;

                // data gathering for behavioralLines
                if (!behavioral_chart_data.hasOwnProperty(timestamp)) {
                    behavioral_chart_data[timestamp] = {}
                }

                Object.keys(currentTimeStampValues).forEach(key => {
                    if (key != 'timestamp') {
                        // stacked area chart
                        if (!stacked_area_chart_data[timestamp].hasOwnProperty(METRICS[index])) {
                            stacked_area_chart_data[timestamp][METRICS[index]] = 0.0
                        }
                        value = parseFloat(currentTimeStampValues[key]);
                        stacked_area_chart_data[timestamp][METRICS[index]] += value;

                        // behavioral lines
                        if (!behavioral_chart_data[timestamp].hasOwnProperty(key)) {
                            behavioral_chart_data[timestamp][key] = {}
                        }
                        if (!behavioral_chart_data[timestamp][key].hasOwnProperty(METRICS[index])) {
                            behavioral_chart_data[timestamp][key][METRICS[index]] = 0
                        }
                        behavioral_chart_data[timestamp][key][METRICS[index]] = value;
                    }
                });
            });
        });

        // console.log(behavioral_chart_data);
        performComputationForBehavioralLines();
        // preprocessing for stacked area chart for computing average
        Object.keys(stacked_area_chart_data).forEach(timestamp => {
            Object.keys(stacked_area_chart_data[timestamp]).forEach(metrics => {
                if (metrics != 'timestamp') {
                    stacked_area_chart_data[timestamp][metrics] /= TOTAL_NUMBER_OF_NODES;
                }
            })
        });

        behvaioralsvg = d3.select(".behavioralSimilarityLineChart")
        width = behvaioralsvg.style("width")
        width = parseInt(width.substring(0, width.length - 2));
        height = behvaioralsvg.style("height")
        height = parseInt(height.substring(0, height.length - 2));

        const brush = d3.brush()
            .extent([[ 0, 0 ], [ width - margin.right, height - margin.bottom ]])
            .on('end', d => {
                Bbrushed(d);
            });
    
        
        behvaioralsvg.append('g')
            .attr('id', 'behavior-x-brush')
            .attr('class', 'x-brush')
            .call(brush)
        
        // behavioral Lines
        behvaioralsvg
            .append('g')
            .attr('class', 'x-axis')

        behvaioralsvg
            .append('g').attr('class', 'behavioralLines');

        behvaioralsvg.append('g')
            .attr('class', 'x-axis-grid')

        // now plotting stacked area chart
        svgStackArea = d3.select(".stackAreaChart");

        // svgStackArea.append('g')
        //     .attr('class', 'x-brush');

        svgStackArea.append("g")
            .attr("class", "x-axis");

        buildStackedAreaChart();

        behavioraltoolTip = d3.select('body')
            .append("div")  
            .attr("id", "myTooltipb")    
            .attr("class", "myTooltipb")      
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .style('padding', '10px')
            .style('background-color', '#ffffff')
            .style('border-style', 'solid')
            .style('border-radius', '5px')
            .style('border-width', '2px')
            .style('color', '#000000')
            .style('text-align', 'center')
            .text('a simple behavioraltoolTip');


        setTimeout(() => {
            times = Object.keys(stacked_area_chart_data);
            if(extent.length == 0){
                times = Object.keys(stacked_area_chart_data);
            }else{
                // console.log(extent);
                times = extent;
            }
            drawBehavioralLines([times[0], times[times.length - 1]]);
            removeLoader();
        }, 1000);
        showLoader();
    });
})


function computeWeight(t, k) {
    return Math.pow(e, -(Math.sqrt(Math.abs(t - k)) / Math.sqrt(k)));
}

function performComputationForBehavioralLines() {
    behavioral_lines_chart_data = [];
    timestamps = Object.keys(behavioral_chart_data);
    nodes = Object.keys(behavioral_chart_data[timestamps[0]]);
    // timestamps.forEach(time => {
    //     nodes.forEach(node => {
    //         Object.keys(metricsAndFilePaths).forEach(metric => {
    //             _.omit(behavioral_chart_data[timestamp][node],metric + "Mean");
    //             _.omit(behavioral_chart_data[timestamp][node],metric + "SD");
    //         })
    //     });
    // });
    // console.log(behavioral_chart_data);
    numberOfTimeStamps = timestamps.length;
    weightsTK = {}
    maxMeansAndVariancePerTimeStampAndMetrics = {}
    SIJs = {}
    timestamps.forEach((timestamp, index) => {
        // compute weight for each timestamp
        for (var i = index - userSelectedA; i <= index + userSelectedA; i++) {
            if (i >= 0 && i < numberOfTimeStamps) {
                t = new Date(timestamp).getTime()
                k = new Date(timestamps[i]).getTime()
                if (t == k) {
                    weightsTK[t + "_" + k] = computeWeight(t, 0);
                } else {
                    // TODO: doubt
                    weightsTK[t + "_" + k] = computeWeight(t, k);
                }
            }
        }
        // At each timestamp compute mean and variance for each node per metrics
        maxMeansAndVariancePerTimeStampAndMetrics[timestamp] = {}
        Object.keys(behavioral_chart_data[timestamp]).forEach((nodeI, nodeIndex) => {
            Object.keys(metricsAndFilePaths).forEach(metricD => {
                // computing mean for metricD
                numerator = 0
                denominator = 0
                for (var i = index - userSelectedA; i <= index + userSelectedA; i++) {
                    if (i >= 0 && i < numberOfTimeStamps) {
                        t = new Date(timestamp).getTime()
                        k = new Date(timestamps[i]).getTime()
                        numerator += behavioral_chart_data[timestamps[i]][nodeI][metricD] * weightsTK[t + "_" + k];
                        denominator += weightsTK[t + "_" + k];
                    }
                }
                behavioral_chart_data[timestamp][nodeI][metricD + "Mean"] = numerator / denominator;

                // max mean at this timestamp per metric
                if (!maxMeansAndVariancePerTimeStampAndMetrics[timestamp].hasOwnProperty(metricD + "MeanMax")) {
                    maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"] = 0;
                }
                maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"] = Math.max(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"]
                    , behavioral_chart_data[timestamp][nodeI][metricD + "Mean"]);
                // min mean at this timestamp per metric
                if (!maxMeansAndVariancePerTimeStampAndMetrics[timestamp].hasOwnProperty(metricD + "MeanMin")) {
                    maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"] = behavioral_chart_data[timestamp][nodeI][metricD + "Mean"];
                }
                maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"] = Math.min(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"]
                    , behavioral_chart_data[timestamp][nodeI][metricD + "Mean"]);

                // if(isNaN(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"])){
                //     console.log(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"]);
                // }

                // if(isNaN(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"])){
                //     console.log(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"]);
                // }

                numerator = 0
                for (var i = index - userSelectedA; i <= index + userSelectedA; i++) {
                    if (i >= 0 && i < numberOfTimeStamps) {
                        t = new Date(timestamp).getTime()
                        k = new Date(timestamps[i]).getTime()
                        numerator += (Math.pow(behavioral_chart_data[timestamps[i]][nodeI][metricD], 2)
                            - Math.pow(behavioral_chart_data[timestamp][nodeI][metricD + "Mean"], 2)) * weightsTK[t + "_" + k];
                    }
                }
                behavioral_chart_data[timestamp][nodeI][metricD + "SD"] = Math.sqrt(Math.abs(numerator / denominator));


                // max SD at this timestamp per metric
                if (!maxMeansAndVariancePerTimeStampAndMetrics[timestamp].hasOwnProperty(metricD + "SDMax")) {
                    maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"] = 0;
                }
                maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"] = Math.max(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"]
                    , behavioral_chart_data[timestamp][nodeI][metricD + "SD"]);

                // min SD at this timestamp per metric
                if (!maxMeansAndVariancePerTimeStampAndMetrics[timestamp].hasOwnProperty(metricD + "SDMin")) {
                    maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"] = behavioral_chart_data[timestamp][nodeI][metricD + "SD"];
                }
                maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"] = Math.min(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"]
                    , behavioral_chart_data[timestamp][nodeI][metricD + "SD"]);

                // if(isNaN(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"])){
                //     console.log(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"]);
                // }

                // if(isNaN(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"])){
                //     console.log(maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"]);
                // }

            })
        });

        SIJs[timestamp] = {}

        Object.keys(behavioral_chart_data[timestamp]).forEach((nodeI, nodeIndex) => {
            if (!behavioral_lines_chart_data.hasOwnProperty(nodeI)) {
                behavioral_lines_chart_data[nodeI] = {
                    "id": nodeI,
                    "items": []
                }
            }
            if (nodeI != userSelectedNode) {
                Sij = 0;
                Object.keys(metricsAndFilePaths).forEach(metricD => {
                    term1 = Math.pow((behavioral_chart_data[timestamp][userSelectedNode][metricD + "Mean"] - behavioral_chart_data[timestamp][nodeI][metricD + "Mean"])
                        / (maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMax"] - maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "MeanMin"]), 2)
                    term2 = Math.pow((behavioral_chart_data[timestamp][userSelectedNode][metricD + "SD"] - behavioral_chart_data[timestamp][nodeI][metricD + "SD"])
                        / (maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMax"] - maxMeansAndVariancePerTimeStampAndMetrics[timestamp][metricD + "SDMin"]), 2)
                    Sij = Math.sqrt(term1 + term2);
                });
                SIJs[timestamp][userSelectedNode + nodeI] = 1 / Sij;
                // if(isNaN(SIJs[timestamp][userSelectedNode + nodeI])){
                //     console.log(timestamp)
                // }
                behavioral_lines_chart_data[nodeI]["items"].push(
                    {
                        "timestamp": timestamp,
                        "nodeInfo": behavioral_chart_data[timestamp][nodeI],
                        "similarity": SIJs[timestamp][userSelectedNode + nodeI] > 10 ? 5:  SIJs[timestamp][userSelectedNode + nodeI]
                    }
                )

            } else {
                SIJs[timestamp][userSelectedNode + nodeI] = 0;
                behavioral_lines_chart_data[nodeI]["items"].push(
                    {
                        "timestamp": timestamp,
                        "nodeInfo": behavioral_chart_data[timestamp][userSelectedNode],
                        "similarity": 0
                    }
                )
            }
        });

    });
    // console.log(SIJs);

}

function getDateAndTime(date) {
    const [dateValues, timeValues] = date.split(' ');
    const [day, month, year] = dateValues.split('/');
    const [hours, minutes] = timeValues.split(':');
    return new Date(+year, +month - 1, +day, +hours, +minutes, 0)
}

//const parseTime = d3.timeParse("%d/%m/%Y %H:%M");
function buildStackedAreaChart() {
    const svg = d3.select(".stackAreaChart");
    svg.selectAll(".label").remove();
    svg.selectAll(".x-brush").remove();
    svg.selectAll(".x-label-stackedArea").remove();

    width = svg.style("width")
    width = parseInt(width.substring(0, width.length - 2));
    height = svg.style("height")
    height = parseInt(height.substring(0, height.length - 2));

    const color = ["lightgreen", "lightblue", "lightpink", "#14B1A0"];

    data = Object.values(stacked_area_chart_data);
    // Create stack
    const stack = d3.stack().keys(METRICS);
    const stackedValues = stack(data);
    const stackedData = [];

    // Copy the stack offsets back into the data.
    stackedValues.forEach((layer, index) => {
        const currentStack = [];
        layer.forEach((d, i) => {
            currentStack.push({
                values: d,
                timestamp: data[i].timestamp
            });
        });
        stackedData.push(currentStack);
    });

    // Create scales
    const yScale = d3
        .scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, d3.max(stackedValues[stackedValues.length - 1], dp => dp[1])]);
    const xScale = d3
        .scaleLinear()
        .range([margin.left, width - margin.right])
        .domain(d3.extent(data, dataPoint => new Date(dataPoint.timestamp)));

    xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M"));

    const area = d3.area()
        .x(dataPoint => xScale(new Date(dataPoint.timestamp)))
        .y0(dataPoint => yScale(dataPoint.values[0]))
        .y1(dataPoint => yScale(dataPoint.values[1]));

    svg.append("text")
        .attr("class", "x-label-stackedArea")
        .text("Time")
        .attr('transform', (d, i) => `translate(${width/2 - margin.right},${height - margin.bottom + 30}) `)

    const colorsAndLabels = svg
        .selectAll(".label")
        .data(Object.keys(metricsAndFilePaths))
        .enter()
        .append("g")
        .attr("class", "label");

    // labels
    const texts = colorsAndLabels
        .append("text")
        .attr('class', (d, i) => '_text-label')
        .attr('dy', '0.35em')
        .style('font-family', 'sans-serif')
        .style('font-size', 12)
        .text(d => d)
        .attr('transform', (d, i) => `translate(${width * 3.5 / 5 - margin.right * 4 + 90 * i},${height - margin.bottom + 30}) `)

    // rectangles for labels
    const rectangles = colorsAndLabels
        .append("rect")
        .attr('class', 'rectLabels')
        .attr('width', 10)
        .attr('x', (d, i) => width * 3.5 / 5 - margin.right * 4 + 90 * i - 15)
        .style('fill', (d, i) => {
            return color[i]
        })
        .attr('height', 10)
        .attr('y', (d, i) => height - margin.bottom + 25)

    const series = svg
        .selectAll(".series")
        .data(stackedData)
        .join(
            enter => {
                t = enter.append("g")
                    .attr("class", "series");
                // each stack
                t.append("path")
                    .style("fill", (d, i) => color[i])
                    .attr("class", "area")
                    .attr("stroke", "steelblue")
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", strokeWidth)
                    .attr("d", d => area(d));
            },
            update => {
                update.selectAll(".area").transition().attr("d", d => area(d));
            },
            exit => {
                exit.transition()
                    .duration(250)
                    .style("opacity", 0)
                    .transition().remove()
            }
        )

    // Add the X Axis
    svg.select(".x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);

    // Add the Y Axis
    // svg.select(".y-axis")
    //     .attr('transform', `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(yScale));

    // setting up the brush
    function brushed({ selection }) {
        // extent gives us start and end time on x-axis.
        extent = selection.map(d => new Date(xScale.invert(d)))
        // console.log("updating chart",extent)
        clearSmallSVGs();
        unhideDetailedCharts();
        updateSmallPlotSize();
        updateWindow(extent[0],extent[1])
        drawBehavioralLines(extent);
    }

    const brush = d3.brushX(xScale)
        .extent([[0, 20], [width - margin.right, height - margin.bottom]])
        .on('end', brushed)
        svg.append('g')
            .attr('class', 'x-brush')
            .call(brush);
    
    d3.selectAll(".sttitle").remove()
    svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", margin.top)
    .attr("text-anchor", "middle") 
    .attr("class","sttitle") 
    .style("font-size", "14px") 
    //.style("text-decoration", "underline")  
    .text("Stack Area Chart - Make an area/window selection here to analyze further.");
}


/* plot the behavioral line
    step - 2:
        1) Do the required preprocessing
        2) Values computation as per the Algo (like force values, etc).
        3) drawing the line chart (creating path, animating them, etc).
        4) Interactions: Custom brush that tags the similarly behaving lines, etc.
        5) pass relevant information for triggering and plotting the metric related graphs
*/

function drawBehavioralLines(extent) {
    // updateWindow(extent[0], extent[1]);
    const svg = d3.select(".behavioralSimilarityLineChart");
    const g = d3.select(".behavioralLines");
    svg.selectAll(".x-label-stackedArea").remove();
    if(!enableBrush){
        document.getElementById("behavior-x-brush").style.display = "none";
    }else{
        document.getElementById("behavior-x-brush").style.display = "inherit";
    }
    // svg.selectAll(".x-brush").remove();
    margin = {
        top: 10,
        right: 20,
        bottom: 50,
        left: 25
    }

    width = svg.style("width")
    width = parseInt(width.substring(0, width.length - 2));
    height = svg.style("height")
    height = parseInt(height.substring(0, height.length - 2));

    xData = Object.keys(behavioral_lines_chart_data)
    data = []
    Object.values(behavioral_lines_chart_data).forEach(items => {
        itemsList = []
        items['items'].forEach(item => {
            if (new Date(item.timestamp) >= new Date(extent[0])
                && new Date(item.timestamp) <= new Date(extent[1])) {
                itemsList.push(item);
            }
        })
        data.push({
            "id": items['id'],
            'items': itemsList
        })
    })
    // console.log(data);
    xScale = d3.scaleTime(
        // domain
        [new Date(data[0]['items'][0].timestamp), new Date(data[0]['items'][data[0]['items'].length - 1].timestamp)],
        // range
        [margin.left, width - margin.right]
    );

    xAxis = d3.axisBottom(xScale)

    const indicatorValue = data.map(d => d3.max(d['items'].map(d => d["similarity"])))
    const yMax = d3.max([...indicatorValue])
    const yMin = d3.min([...data.map(d => d3.min(d['items'].map(d => d["similarity"])))])

    yScale = d3.scaleLinear(
        [yMin, yMax],
        [height - margin.bottom, margin.top+10]
    )

    yAxis = d3.axisLeft(yScale);
    INNER_HEIGHT = (height - margin.top - margin.bottom);
    const xAxisGrid = d3.axisBottom(xScale).tickSize(-INNER_HEIGHT).tickFormat('').ticks(20);
    // const yAxisGrid = d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).ticks(10);

    line = d3.line()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d["similarity"]))
        .curve(d3.curveNatural)

    g.selectAll('g')
        .data(data, (d, i) => {
            return d['items'][0].timestamp +  d['items'].length + d['items'][d['items'].length - 1].timestamp + d["items"].map(d => d.similarity).join("_")
        })
        .join(
            enter => {
                const g = enter.append('g')
                    .attr('class', d => {
                        return "nodes_g"
                    })

                path = g.append('path').attr('class', d => '_big-line' )
                    .attr('d', d => line(d['items']))
                    .style('fill', 'none')
                    .style("stroke-width", "1.5")
                    .style("stroke", "grey")
                    .style("opacity", 0.6)

                g.on("mouseover", function (event, d) {
                    date = xScale.invert(event.pageX);
                    date = new Date(Math.round(date.getTime() / coeff) * coeff);
                    node = d['items'].filter(d => {
                        return d.timestamp == date.toString();
                    })
                    behavioraltoolTip
                        .html(
                            `<div>${d.id}</div><div> Sij: ${node[0].similarity}</div><div>timestamp: ${date.toLocaleString()}</div>`
                        )
                        .style('visibility', 'visible');
                    nodeInfo = node[0].nodeInfo;
                    let text = "<table style='font-size: 0.625em; overflow: scroll; height:70%'>"
                    text += "<tr><td><b>timestamp" + "</b>: " + date.toString() + "</td></tr>";
                    text += "<tr><td><b>Node" + "</b>: " + d.id + "</td></tr>";
                    text += "<tr><td><b>Sij" + "</b>: " + node[0].similarity + "</td></tr>";
                    Object.keys(nodeInfo).forEach(key => {
                        if(!key.endsWith("SD"))
                            text += "<tr><td><b>" + key + "</b>: " + nodeInfo[key] + "</td></tr>";
                    });
                    text += "</table>"; 
                    document.getElementById("nodeInfo").innerHTML = text;

                    d3.selectAll(".nodes_g").style("opacity", 0.2)
                    this.style.opacity = 1
                    this.firstChild.style.strokeWidth = 6
                })
                g.on("mousemove", function (event, d) {
                    date = xScale.invert(event.pageX);
                    date = new Date(Math.round(date.getTime() / coeff) * coeff);
                    node = d['items'].filter(d => {
                        return d.timestamp == date.toString();
                    })
                    behavioraltoolTip
                        .html(
                            `<div>${d.id}</div><div> Sij: ${node[0].similarity}</div><div>timestamp: ${date.toLocaleString()}</div>`
                        )
                        .style('top', event.pageY - 10 + 'px')
                        .style('left', event.pageX + 10 + 'px')
                        .style('visibility', 'visible');
                    nodeInfo = node[0].nodeInfo;
                    let text = "<table style='font-size: 0.625em; overflow: scroll; height:70%'>"
                    text += "<tr><td><b>timestamp" + "</b>: " + date.toString() + "</td></tr>";
                    text += "<tr><td><b>Node" + "</b>: " + d.id + "</td></tr>";
                    text += "<tr><td><b>Sij" + "</b>: " + node[0].similarity + "</td></tr>";
                    Object.keys(nodeInfo).forEach(key => {
                        if(!key.endsWith("SD"))
                            text += "<tr><td><b>" + key + "</b>: " + nodeInfo[key] + "</td></tr>";
                    })
                    text += "</table>"    
                    document.getElementById("nodeInfo").innerHTML = text;
                    d3.selectAll(".nodes_g").style("opacity", 0.2)
                    this.style.opacity = 1
                    this.firstChild.style.strokeWidth = 6
                })
                g.on("mouseout", function (event, d) {
                    document.getElementById("nodeInfo").innerHTML = "";
                    behavioraltoolTip.html(``).style('visibility', 'hidden');
                    d3.selectAll(".nodes_g").style("opacity", 0.7)
                    this.firstChild.style.strokeWidth = 2
                });
            },
            update => {
                update.selectAll("._big-line").transition().attr('d', d => line(d['items']))
            },
            exit => {
                exit.transition()
                    .duration(500)
                    .style("opacity", 0)
                    .transition().remove()
            }
        )

    svg.select('.x-axis-grid')
        .style("stroke-width", "0.1")
        .attr('transform', `translate(${0},${INNER_HEIGHT + margin.top} )`)
        .call(xAxisGrid);

    svg.select('.x-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .transition().duration(1000)
        .call(xAxis);

    svg.append("text")
        .attr("class", "x-label-stackedArea")
        .text("Time")
        .attr('transform', (d, i) => `translate(${width/2 - margin.right - 40},${height - margin.bottom + 30}) `)

    // setting up the brush
    // function brushed({ selection }) {
    //     // extent gives us start and end time on x-axis.
    //     let extent = selection.map(d => new Date(xScale.invert(d)))
    //     // drawBehavioralLines(extent);
    //     console.log(extent);
    // }
    d3.selectAll(".bhtitle").remove()
    svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", margin.top+10)
    .attr("text-anchor", "middle")  
    .style("font-size", "14px") 
    .attr("class","bhtitle")
    //.style("text-decoration", "underline")  
    .text("Behavioral Line Chart");

}

function Bbrushed({ selection }) {
    // extent gives us start and end time on x-axis.
    // let extent = selection.map(d => new Date(xScaleLine.invert(d)))
    if(!selection) return
    xMin = selection[0][0];
    yMin = selection[0][1];
    xMax = selection[1][0];
    yMax = selection[1][1];

    l = d3.select(".behavioralSimilarityLineChart").selectAll("path._big-line")
    // console.log("L",l)
    if (xMin === xMax && yMin === yMax) {
        // The selection box is empty
        //l.style("opacity", 1);
    }else{
        //l.style("opacity", 1);
        list_nodes = []
        l.filter(function (d) {
            function findXIntersection(x) {
                var lower = d.items.filter(v => x >= xScale(new Date(v.timestamp)))
                  lower.reduce((a, b) => new Date(a.timestamp) >= new Date(b.timestamp) ? a : b)
                var upper = d.items.filter(v => x <= xScale(new Date(v.timestamp)))
                  upper.reduce((a, b) => new Date(a.timestamp) >= new Date(b.timestamp) ? b : a)
                var lowerX = xScale(new Date(lower.timestamp))
                var lowerY = yScale(lower.similarity)
                var upperX = xScale(new Date(upper.timestamp))
                var upperY = yScale(upper.similarity)
                var a = (upperY - lowerY) / (upperX - lowerX)
                var b = upperY - (a * upperX)
                return (a * x) + b
              }

            function findYIntersection(x,y) {
                var lower = d.items.filter(v => x >= xScale(new Date(v.timestamp)))
                if(lower.length==0) return -1;
                lower.reduce((a, b) => new Date(a.timestamp) >= new Date(b.timestamp) ? a : b)
                var upper = d.items.filter(v => x <= xScale(new Date(v.timestamp)))
                if(upper.length==0) return -1;
                upper.reduce((a, b) => new Date(a.timestamp) >= new Date(b.timestamp) ? b : a)
                var lowerX = xScale(new Date(lower.timestamp))
                var lowerY = yScale(lower.similarity)
                var upperX = xScale(new Date(upper.timestamp))
                var upperY = yScale(upper.similarity)
                var a = (upperY - lowerY) / (upperX - lowerX)
                var b = upperY - (a * upperX)
                var inx = (y-b)/a;
                if((inx>lowerX&&inx>upperX)||(inx<lowerX&&inx<upperX)){
                    return -1;
                }
                return inx;
            }
            
            var internalPoints = d.items.filter(
              v => (xMin <= xScale(new Date(v.timestamp))) && (xScale(new Date(v.timestamp)) <= xMax));

            // var resVal = internalPoints.filter(
            //     v=>(yMin<=yScale(v.similarity)) && (yScale(v.similarity)<=yMax));
            // if(resVal.length>0){
            //     list_nodes.push(d.id)
            //     return true;
            // }
            var pbelow = false;
            var pabove = false;
            for(var ip=0;ip<internalPoints.length;ip++){
                nv = yScale(internalPoints[ip].similarity);
                if(yMin<=nv&&nv<=yMax){
                    list_nodes.push(d.id)
                    return true;
                }
                if(nv<yMin) pbelow=true;
                if(nv>yMax) pabove=true;
            }
            if(pbelow&&pabove){
                list_nodes.push(d.id)
                    return true;
            }
            var xMinY = findXIntersection(xMin)
            var xMaxY = findXIntersection(xMax)
            // console.log(yMin,yMax,xMinY,xMaxY)
            if((yMin<=xMinY && xMinY<=yMax) || (yMin<=xMaxY&&xMaxY<=yMax)){
                list_nodes.push(d.id)
                return true;
            }
            var yMinX = findYIntersection(xMin,yMin);
            var yMaxX = findYIntersection(xMax,yMax);
            if((yMinX!=-1&&xMin<=yMinX&&yMinX<=xMax)||(yMaxX!=-1&&xMin<=yMaxX&&yMaxX<=xMax)){
                list_nodes.push(d.id)
                return true;
            }
            return false;
           })
           .style("opacity",1)
           .style("stroke",colorsx[coloridxx])
           setLinesx(list_nodes)
    }        
    // console.log("BSelection",selection)
}
var coloridxx = 0
colorsx = ["#58508D", "#BC5090", "#00798C", "#FF00BF"];
function setLinesx(nodes){
    if(nodes.length<=0) return;
    res = {
        nodes: nodes,
        color: colorsx[coloridxx],
        //selection: coloridx,
        start_time: prev_start_time,
        end_time: prev_end_time
    };
    updateSmallPlots(res)
    coloridxx=(coloridxx+1)%4;
}

function showLoader(){
    $("div.spanner").addClass("show");
    $("div.overlay").addClass("show");
}

function removeLoader(){
    $("div.spanner").removeClass("show");
    $("div.overlay").removeClass("show");
}

function onBaselineNodeChanged(event){
    showLoader();
    document.getElementById('userSelectedNode').disabled = true;
    userSelectedNode = 'node'+parseInt(event.value);
    performComputationForBehavioralLines();
    setTimeout(() => {
        if(extent.length == 0){
            times = Object.keys(stacked_area_chart_data);
        }else{
            times = extent;
        }
        drawBehavioralLines([times[0], times[times.length - 1]]);
        removeLoader();
        document.getElementById('userSelectedNode').disabled = false;
    }, 2000);
    
}


function onAChanged(event){
    showLoader();
    document.getElementById('useSelectedA').disabled = true;
    userSelectedA = parseInt(event.value);
    performComputationForBehavioralLines();
    setTimeout(() => {
        if(extent.length == 0){
            times = Object.keys(stacked_area_chart_data);
        }else{
            times = extent;
        }
        drawBehavioralLines([times[0], times[times.length - 1]]);
        removeLoader();
        document.getElementById('useSelectedA').disabled = false;
    }, 2000);
}