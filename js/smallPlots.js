metricsAndFilePaths = {
    "CPU": "./../data/cpu_p.csv",
    "DISK": "./../data/disk_p.csv",
    "MEMORY": "./../data/memory_p.csv",
    "NETWORK": "./../data/network_p.csv"
}
var IND_PLOT_DATA = {};
var small_svg;

const modal_styles = {
    height: 500,
    width: 700,
    margin_top: 40,
    margin_right: 115,
    margin_bottom: 110,
    margin_left: 60
}

SELECTIONS = [[], [], [], []]
// colors = ["red", "blue", "green", "orange"]
modal_colors = d3.scaleOrdinal(d3.schemeSet2)

document.addEventListener('DOMContentLoaded', function(){
    small_svg={
        height : d3.select('#cpu_0').node().getBoundingClientRect().height,
        width: d3.select('#cpu_0').node().getBoundingClientRect().width,
        margin_left: 16,
        margin_bottom: 16,
        margin_right: 25,
        margin_top: 5
    }
    var modal_container = document.getElementById('modal_container')
    var modal_button = document.getElementById('modal_button').onclick = function(){
        modal_container.style.display = "none"
    }

    // read data
    Promise.all(Object.entries(metricsAndFilePaths).map(([k, d]) => d3.csv(d, (d1) => {
            var my_row = {
                timestamp: getDateAndTime(d1.timestamp),
                metric: k
            }
            for (let i = 1; i <= 50; i++){
                my_row["node"+i] = +d1["node"+i]
            }
            return my_row
        }).then(data => {
            IND_PLOT_DATA[k] = data
        })
    ))

})
function updateSmallPlotSize(){
small_svg={
        height : d3.select('#cpu_0').node().getBoundingClientRect().height,
        width: d3.select('#cpu_0').node().getBoundingClientRect().width,
        margin_left: 16,
        margin_bottom: 16,
        margin_right: 25,
        margin_top: 5
    }
}
addEventListener("resize", (event) => {
    updateSmallPlotSize()
});

var selection = -1
var selcolor = ["black","black","black","black"]
function updateSmallPlots(input_obj){
    let start = input_obj.start_time
    let end = input_obj.end_time
    //let selection = input_obj.selection
    selection=selection+1;
    selection=selection%4;
    let nodes = input_obj.nodes
    SELECTIONS[selection] = nodes //overwrite after 4 selections
    selcolor[selection]=input_obj.color

    for (let i=0; i < SELECTIONS.length; i++){
        // Create the data to plot for each selection
        Object.entries(IND_PLOT_DATA).map(([key, data]) => {
            var filtered = []
            var max = 0
            var min_date = end
            var max_date = start
            for (const row of data){
                if (row.timestamp >= start && row.timestamp <= end){
                    var temp_obj = {"timestamp": row.timestamp}
                    for (n of SELECTIONS[i]){
                        temp_obj[n] = row[n]
                        max = Math.max(max, row[n])
                    }
                    min_date = row.timestamp < min_date ? row.timestamp : min_date
                    max_date = row.timestamp > max_date ? row.timestamp : max_date
                    filtered.push(temp_obj)  
                }
            }
            plotSmallSvg(min_date, max_date, max, filtered, key.toLowerCase(), i,selcolor[i])
        })
    } 
    
}

function clearSmallSVGs(){
    console.log("clearing SVGs...")
    SELECTIONS = [[], [], [], []]
    selection = -1
    d3.selectAll(".linesToRemove").remove();
}


function plotSmallSvg(start, end, max, data, att, col,color){
    // have data as timestamp: , value:
    // When there is cross over, data length is zero, this fails.
    try{
        var node_list = Object.keys(data[0]).splice(1,)
    }
    catch(err){
        return
    }

    var node_data = {}
    for (n of node_list){
        node_data[n] = []
    }
    for (row of data){
        for (n of node_list){
            node_data[n].push({
                "timestamp": row.timestamp,
                "value": row[n],
                "node": n
            })
        }
    }

    var svg = d3.select("#"+att+"_"+col)
    svg.selectAll("svg > *").remove();

    var yScale = d3.scaleLinear().domain([0, max]).range([small_svg.height-small_svg.margin_bottom, 0+small_svg.margin_top]).nice();
    var xScale = d3.scaleTime().domain([start, end]).range([0, small_svg.width-small_svg.margin_right]);


    var line = d3.line()
        .x(function(d) { return xScale(d.timestamp)+small_svg.margin_left})
        .y(function(d) { return yScale(d.value)})
        .curve(d3.curveMonotoneX);

    x_axis = svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(" + (small_svg.margin_left) + "," + (small_svg.height-small_svg.margin_bottom) + ")")
        .attr("stroke-width", "1px")
        .call(d3.axisBottom(xScale).ticks(3).tickFormat(d3.timeFormat("%H:%M")))
    x_axis.selectAll('text').attr('font-size', 4)

    y_axis = svg.append("g")
        .attr("class", "y_axis")
        .attr("transform", "translate(" + (small_svg.margin_left) + "," + (0)  + ")")
        .attr("stroke-width", "1")
        .call(d3.axisLeft(yScale).ticks(3))
    y_axis.selectAll('text').attr('font-size', 4)

    for (node of node_list){
        var path = svg.selectAll(".line"+att+node)
            .append("g")
            .data([node_data[node]])
            .attr("class", att)
            .join("path") 
                .attr("class", "line"+att) 
                .attr("class","linesToRemove")
                .attr("d", (d) => line(d)) 
                .attr("stroke-width", "1")
                .attr("stroke", color)
                .attr("fill", "none")
    }
    svg.data([node_data])

    svg.on('mouseover', function(){
        svg.attr('style', "border: solid black 3px;")
    })

    svg.on('mouseout', function(){
        svg.attr('style', "border: solid black 1px;")
    })

    svg.on('click', function(i, click_data){

        modal_container.style.display = "flex"
        var modal_svg = d3.select("#modal_svg")
        modal_svg.selectAll("svg > *").remove();

        var modal_yScale = d3.scaleLinear().domain([0, max]).range([modal_styles.height-modal_styles.margin_bottom, 0 + modal_styles.margin_top]).nice();
        var modal_xScale = d3.scaleTime().domain([start, end]).range([0, modal_styles.width-modal_styles.margin_right ]);

        var modal_line = d3.line()
            .x(function(d) { return modal_xScale(d.timestamp)+modal_styles.margin_left})
            .y(function(d) { return modal_yScale(d.value)})
            .curve(d3.curveMonotoneX);

        var mag_text = att == 'cpu'? 'CPU utilization': att == 'disk' ? 'Disk utilization': att == 'memory' ? 'RAM utilization' : 'Network usage'

        modal_x_axis = modal_svg.append("g")
            .attr("class", "x_axis")
            .attr("transform", "translate(" + (modal_styles.margin_left) + "," + (modal_styles.height-modal_styles.margin_bottom) + ")")
            .attr("stroke-width", "1")
            .call(d3.axisBottom(modal_xScale).ticks(6).tickFormat(d3.timeFormat("%H:%M")))
        modal_x_axis.selectAll('text').attr('font-size', 14)
            modal_svg.append("text")
                .attr("class", "x_label")
                .attr("transform", "rotate(-90)", "translate("+ (modal_styles.height) + "," + (modal_styles.margin_left) +")")
                .attr("y", 24)
                .attr("x", -modal_styles.height/2 +75)
                .style("text-anchor", "end")
                .text(mag_text);


        modal_y_axis = modal_svg.append("g")
            .attr("class", "y_axis")
            .attr("transform", "translate(" + (modal_styles.margin_left) + "," + (0)  + ")")
            .attr("stroke-width", "1")
            .call(d3.axisLeft(modal_yScale).ticks(6))
        modal_y_axis.selectAll('text').attr('font-size', 14)
        modal_svg.append("text")
            .attr("class", "y_label")
            .attr("y", modal_styles.height-60)
            .attr("x", modal_styles.width/2)
            .style("text-anchor", "end")
            .text("Time");

        for (node of node_list){
            var path = modal_svg.selectAll(".line_modal_svg")
                .append("g")
                .data([click_data[node]])
                .join("path") 
                    .attr("id", "line"+node)
                    .attr("d", (d) => modal_line(d)) 
                    .attr("stroke-width", "3")
                    .attr("stroke", modal_colors(node))
                    .attr("fill", "none")
                    .style("opacity", 0.7)

                path.on('mouseover', function(d, i){
                        focus_opacity(i[0]['node'])
                        })
                path.on('mouseout', function(d, i){
                        reset_opacity()
                        })

            var lines = modal_svg.selectAll("#line"+node)
            var x_y = lines.node().getAttribute("d").split(",").slice(-2)
            modal_svg.append("circle")
                .data(x_y)
                .join("circle")
                    .attr("id", "circle"+node)
                    .attr("transform", "translate(" + (x_y[0]) + "," + (x_y[1])  + ")")
                    .attr("r", "8")
                    .attr("fill", modal_colors(node))
                    .style("opacity", 0.7)
                    .on('mouseover', function(d, i){
                        focus_opacity(d.target.id.slice(6,))
                        })
                    .on('mouseout', function(d, i){
                        reset_opacity()
                        })

            modal_svg.append("text")
                .join("text")
                .attr("id", "text"+node)
                .attr("y", 4)
                .attr("x", 8)
                .attr("transform", "translate(" + (x_y[0]) + "," + (x_y[1])  + ")")
                .text(node)
                .attr("fill", modal_colors(node))
                .style("font-size", "12px")
                .style("opacity", 0.7)
                .on('mouseover', function(d, i){
                    focus_opacity(d.target.id.slice(4,))
                    })
                .on('mouseout', function(d, i){
                    reset_opacity()
                    })
        }
    })

}

function focus_opacity(nodeid){
    var modal_svg = d3.select("#modal_svg")
    for (let i=0; i <= 50; i++) {
        if ("node"+i !== nodeid){
            modal_svg.select("#line"+"node"+i)
                .attr("stroke-width", "5")
                .style("opacity", 0.1)
            modal_svg.select("#circle"+"node"+i)
                .style("opacity", 0.1)
            modal_svg.select("#text"+"node"+i)
                .style("opacity", 0.1)
        } else {
            modal_svg.select("#line"+nodeid)
                .attr("stroke-width", "5")
                .style("opacity", 1)
            modal_svg.select("#circle"+nodeid)
                .style("opacity", 1)
            modal_svg.select("#text"+nodeid)
                .style("opacity", 1)
        }
    }
}

function reset_opacity(){
    var modal_svg = d3.select("#modal_svg")
    for (let i=0; i <= 50; i++) {
        modal_svg.select("#line"+"node"+i)
            .attr("stroke-width", "5")
            .style("opacity", 0.7)
        modal_svg.select("#circle"+"node"+i)
            .style("opacity", 0.7)
        modal_svg.select("#text"+"node"+i)
            .style("opacity", 0.7)
    }
}

