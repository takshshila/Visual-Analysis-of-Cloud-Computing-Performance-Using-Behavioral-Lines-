
    //GLOBAL VARIABLES
    var cpu_data, cpu_p_data, disk_p_data, memory_p_data, network_p_data,log_p,data;
    var node_total_data = {}, node_list = {};
    var start_time, end_time;
    var nodes = [], cpu_nodes = [], disk_nodes = [], memory_nodes = [], network_nodes = [], log_nodes=[];
    var bisectDate = d3.bisector(function(d) { return d.items; }).left
    //for reading the time data(dates)
    const parseTime = d3.timeParse("%d/%m/%Y %H:%M");
    var prev_end_time = parseTime("07/08/2022 21:45");
    var prev_start_time= parseTime("07/08/2022 21:25");
    //LINE CHART: Inner Width and Height
    var coloridx = 0
    colors = ["red", "blue", "green", "orange"];
    var lineSvg; 
    var g1;

    // const lwidth = 500//d3.select('#line_svg').node().getBoundingClientRect().width; 
    // const lheight = 700//d3.select('#line_svg').node().getBoundingClientRect().height;
    var lwidth;
    var lheight;
    var lmargin = { top:20, bottom: 20, right: 20, left: 20 };
    var linnerWidth;
    var linnerHeight;

    var xScaleLine;

    //Y axis initialization and attachment for lineSvg
    var yScaleLine;

    //line graph init
    var lines;
    const singleLine = d3.line();  
    var tooltip;
    //LINE CHART SVG and SCALES INIT
    //line chart svg
    document.addEventListener('DOMContentLoaded', async function () {
        
        //lines =lineSvg.selectAll('path').attr("class", "myLine");
        
        Promise.all([d3.csv('./../data/disk_p.csv'), d3.csv('./../data/cpu_p.csv'), d3.csv('./../data/memory_p.csv'), d3.csv('./../data/network_p.csv'),d3.csv('./../data/logs.csv')])
    .then(function (value) {
        console.log('loading the data');
        var cpu_data_read = value[1];
        var disk_data_read = value[0];
        var memory_data_read = value[2];
        var network_data_read = value[3];
        var log_data_read = value[4];
        // Data Wrangling for CPU DATA
        data = cpu_data_read;

        data.map(function(d) {
            d.timestamp = parseTime(d["timestamp"]);
            for(var column in d){
                if(column!="timestamp")
                    d[column] = +d[column];
            }
        });
        cpu_p_data = data;

        // Data Wrangling for DISK DATA
        data = disk_data_read;
        data.map(function(d) {
            d.timestamp = parseTime(d["timestamp"]);
            for(var column in d){
                if(column!="timestamp")
                    d[column] = +d[column];
            } 
        });
        disk_p_data = data;

        // Data Wrangling for MEMORY DATA
        data = memory_data_read;
        data.map(function(d) {
            d.timestamp = parseTime(d["timestamp"]);
            for(var column in d){
                if(column!="timestamp")
                    d[column] = +d[column];
            } 
        });
        memory_p_data = data;

        // Data Wrangling for NETWORK DATA
        data = network_data_read;
        data.map(function(d) {
            d.timestamp = parseTime(d["timestamp"]);
            for(var column in d){
                if(column!="timestamp")
                    d[column] = +d[column];
            } 
        });
        network_p_data = data;

        data = log_data_read;
        data.map(function(d) {
            d.timestamp = parseTime(d["timestamp"]);
            // for(var column in d){
            //     if(column!="timestamp")
            //         d[column] = +d[column];
            // } 
        });
        log_p_data = data;

        
        //Start drawing the chart
        updateChart()
    });
    })

    // var element = d3.select('#line_svg').node().getBoundingClientRect().width;
    // console.log(" Width >>>>>>", element);

    //X axis initialization and attachment for lineSvg
   

    function stringToDate(_date,_format,_delimiter)
    {
        var formatLowerCase=_format.toLowerCase();
        var formatItems=formatLowerCase.split(_delimiter);
        var dateItems=_date.split(_delimiter);
        var monthIndex=formatItems.indexOf("mm");
        var dayIndex=formatItems.indexOf("dd");
        var yearIndex=formatItems.indexOf("yyyy");
        var month=parseInt(dateItems[monthIndex]);
        month-=1;
        var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
        return formatedDate;
    }

    
    //reading the data
    

    function parseNodes(start_time,end_time){
        // start_time = parseTime(start_time)
        // end_time = parseTime(end_time)
        nodes = [], cpu_nodes = [], disk_nodes = [], memory_nodes = [], network_nodes = [], log_nodes=[]
        //adding the node data for the line chart
        for(const [key, val] of Object.entries(cpu_p_data)) {
            if(key!="columns"){
                for(var node in val){
                    if(node=="timestamp"){
                        if(val['timestamp']<start_time || val['timestamp'>end_time]){
                            //
                            break;
                        }
                    }
                    if(node!="timestamp"){
                        var node_present = 0;
                        for(var i=0; i<cpu_nodes.length; i++){
                            if(cpu_nodes[i]["id"] == node){
                                cpu_nodes[i]["items"].push({timestamp: val["timestamp"], NodeValue: val[node]});
                                node_present = 1;
                                break;
                            }
                        }
                        if(!node_present)
                            cpu_nodes.push({id: node, items: [{timestamp: val["timestamp"], NodeValue: val[node]}]});
                    }
                }
            }
        }

        for(const [key, val] of Object.entries(disk_p_data)) {
            if(key!="columns"){
                for(var node in val){
                    if(node=="timestamp"){
                        if(val['timestamp']<start_time || val['timestamp'>end_time]){
                            //
                            break;
                        }
                    }
                    if(node!="timestamp"){
                        var node_present = 0;
                        for(var i=0; i<disk_nodes.length; i++){
                            if(disk_nodes[i]["id"] == node){
                                disk_nodes[i]["items"].push({timestamp: val["timestamp"], NodeValue: val[node]});
                                node_present = 1;
                                break;
                            }
                        }
                        if(!node_present)
                            disk_nodes.push({id: node, items: [{timestamp: val["timestamp"], NodeValue: val[node]}]});
                    }
                }
            }
        }

        for(const [key, val] of Object.entries(memory_p_data)) {
            if(key!="columns"){
                for(var node in val){
                    if(node=="timestamp"){
                        if(val['timestamp']<start_time || val['timestamp'>end_time]){
                            //
                            break;
                        }
                    }
                    if(node!="timestamp"){
                        var node_present = 0;
                        for(var i=0; i<memory_nodes.length; i++){
                            if(memory_nodes[i]["id"] == node){
                                memory_nodes[i]["items"].push({timestamp: val["timestamp"], NodeValue: val[node]});
                                node_present = 1;
                                break;
                            }
                        }
                        if(!node_present)
                            memory_nodes.push({id: node, items: [{timestamp: val["timestamp"], NodeValue: val[node]}]});
                    }
                }
            }
        }

        for(const [key, val] of Object.entries(network_p_data)) {
            if(key!="columns"){
                for(var node in val){
                    if(node=="timestamp"){
                        if(val['timestamp']<start_time || val['timestamp'>end_time]){
                            //
                            break;
                        }
                    }
                    if(node!="timestamp"){
                        var node_present = 0;
                        for(var i=0; i<network_nodes.length; i++){
                            if(network_nodes[i]["id"] == node){
                                network_nodes[i]["items"].push({timestamp: val["timestamp"], NodeValue: val[node]});
                                node_present = 1;
                                break;
                            }
                        }
                        if(!node_present)
                            network_nodes.push({id: node, items: [{timestamp: val["timestamp"], NodeValue: val[node]}]});
                    }
                }
            }
        }

        for(const [key, val] of Object.entries(log_p_data)) {
            if(key!="columns"){
                for(var node in val){
                    if(node=="timestamp"){
                        if(val['timestamp']<start_time || val['timestamp'>end_time]){
                            //
                            break;
                        }
                    }
                    if(node!="timestamp"){
                        var node_present = 0;
                        for(var i=0; i<log_nodes.length; i++){
                            if(log_nodes[i]["id"] == node){
                                log_nodes[i]["items"].push({timestamp: val["timestamp"], NodeValue: val[node]});
                                node_present = 1;
                                break;
                            }
                        }
                        if(!node_present)
                            log_nodes.push({id: node, items: [{timestamp: val["timestamp"], NodeValue: val[node]}]});
                    }
                }
            }
        }

    }

    //first iteration function
    function drawChart(start_time, end_time){
        
        const blsvg = d3.select(".behavioralSimilarityLineChart");
        lwidth = blsvg.style("width")
        lwidth = parseInt(lwidth.substring(0, lwidth.length - 2));
        lheight = blsvg.style("height")
        lheight = parseInt(lheight.substring(0, lheight.length - 2));

        lineSvg = d3.select("#line_svg")
        lineSvg.selectAll(".myLineXaxis").remove();
        lineSvg.selectAll(".myLineYaxis").remove();
        lineSvg.selectAll(".x-brush").remove();
        var brush = d3.brush()
        .extent([[ 0, 20 ], [ lwidth - lmargin.right, lheight - lmargin.bottom ]])
        .on('end', brushed)

        if(enableBrush){
            lineSvg.append('g')
                .attr('class', 'x-brush')
                .call(brush)
        }
        //.attr('transform', 'translate(0,0)')//.style("overflow","visible"); 
        // lwidth = lineSvg.style("width")
        // lwidth = parseInt(lwidth.substring(0, lwidth.length - 2));
        // lheight  = lineSvg.style("height")
        // lheight = parseInt(lheight.substring(0, lheight.length - 2));
        // lwidth = 600;
        // lheight = 1000;
        linnerWidth = lwidth - lmargin.left - lmargin.right;
        linnerHeight = lheight - lmargin.top - lmargin.bottom;
        // xScaleLine = d3.scaleTime()
        // .range([linnerWidth, 30 ]);
        xScaleLine = d3.scaleTime()
        .range([lwidth-lmargin.right-lmargin.left, 50 ]);
        yScaleLine = d3.scaleLinear()
        .range([linnerHeight, 20 ]);

        //g1 = lineSvg.append('g');
        lineSvg.append("g")
        .attr('transform',`translate(0, ${linnerHeight})`)
        .call(d3.axisBottom(xScaleLine))
        .attr("class","myLineXaxis");
        lineSvg.append("g")
        .attr('transform',`translate(50,0)`)
        .call(d3.axisLeft(yScaleLine))
        .attr("class","myLineYaxis");

        d3.selectAll(".x-label").remove()
        d3.selectAll(".y-label").remove()

        lineSvg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", lwidth/2)
        .attr("y", lheight-6)
        .text("Time");
        lineSvg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x",-20)
        .attr("y", 10)
        .attr("dy", ".75em")
        .text(getYLabelText());
        //console.log(start_time,end_time)
        prev_start_time=start_time
        prev_end_time=end_time
        // start_time = parseTime(start_time)
        // end_time = parseTime(end_time)
        //parseNodes(start_time,end_time)

        lineSvg.selectAll('path').remove();
        d3.selectAll(".click-circle").remove()
        

        //Setting the start and end times
        let selected = d3.select("#selectattribute").property("value");

        var log_container = document.getElementById('log_container')
        var log_button = document.getElementById('log_button').onclick = function(){
            log_container.style.display = "none"
        }

        if(selected == "cpu"){
            cpu_data = cpu_p_data;
            nodes = cpu_nodes;
        }
        if(selected == "disk"){
            cpu_data = disk_p_data;
            nodes = disk_nodes;
        }
        if(selected == "network"){
            cpu_data = network_p_data;
            nodes = network_nodes;
        }
        if(selected == "memory"){
            cpu_data = memory_p_data;
            nodes = memory_nodes;
        }
        // cpu_data = network_p_data;
        // nodes = network_nodes;
        // start_time = d3.min(cpu_data, function(d) { 
        //     return d["timestamp"]; 
        // });
        // end_time = d3.max(cpu_data, function(d) { return d["timestamp"]; });
        //end_time = cpu_data[5]["timestamp"];
        //console.log(start_time, end_time);
        //Setting max and min Node values
        
        var maxNodeVal = d3.max(cpu_data, function(d){
            var node_data = [];
            // if(d["timestamp"]>=start_time && d["timestamp"]<=end_time)
                for(var column in d){
                    if(column!="timestamp"){
                        node_data.push(d[column]);
                    }
                }
            
            var m = Math.max.apply(Math, node_data);
            return m;
        })
        var minNodeVal = d3.min(cpu_data, function(d){
            var node_data = [];
            // if(d["timestamp"]>=start_time && d["timestamp"]<=end_time)
                for(var column in d){
                    if(column!="timestamp"){
                        node_data.push(d[column]);
                    }
                }
            
            var m = Math.min.apply(Math, node_data);
            return m;
        })
        //console.log(minNodeVal, maxNodeVal);
        // var mintime = d3.min(cpu_data,)
        //LINE CHART AXES UPDATE
        //setting X axis time Domain
        // console.log(nodes)
        start_time=nodes[0].items[0].timestamp
       // console.log(start_time)
        xScaleLine.domain([end_time,start_time]);

        //Update X axis with transition
        lineSvg.selectAll(".myLineXaxis")
            .transition()
                .duration(1000)
                .call((d3.axisBottom(xScaleLine)));

        //setting Y axis Domain
        yScaleLine.domain([minNodeVal, maxNodeVal]);

        //Update Y axis with transition
        lineSvg.selectAll(".myLineYaxis")
            .transition()
                .duration(1000)
                .call((d3.axisLeft(yScaleLine)));

        //LINE CHART PLOTTING DATA
        //circle data for checking
        /*lineSvg.selectAll("mynodes")
            .data(cpu_data)
            .enter()
            .append("circle")
            .attr('transform','translate(0, 20)')
            .attr("cy", function(d){
                return yScaleLine(d["Node1"]);
            })
            .attr("cx", function(d){
                return xScaleLine(d["timestamp"]);
            })
            .attr("r", 5)
            .style("fill", "#69b3a2")*/
        
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        singleLine.x(d => xScaleLine(d.timestamp))
            .y(d => yScaleLine(d.NodeValue))
            .curve(d3.curveMonotoneX);
        
        //lineSvg.selectAll(".myLine")

        lsvg = lineSvg.append("g").selectAll("path")
            .data(nodes)
            // .enter()
            .join("path")
                .style('fill','none')
                .attr('class','data-line')
                .attr("clip-path", "url(#clip)")
                .style("stroke-width", "1.5")
                .style("stroke", "grey")
                .style("opacity",0.6)
                .attr('d', function(d) { return singleLine(d.items); });
        var prevSelectedLine = null;

        d3.selectAll(".x-clip").remove()

        lineSvg.append("clipPath")
        .attr("id", "clip") 
        .attr("class","x-clip")
        .append("rect")
        .attr("width", lwidth-lmargin.left-lmargin.right)
        .attr("height", lheight)
        .attr("fill", "blue")

        d3.selectAll(".myTooltip").remove()

        tooltip = d3.select("body").append("div")   
        .attr("id", "myTooltip")    
        .attr("class", "myTooltip")      
        .style("opacity", 1)
        .style("visibility","hidden")

        svgx = d3.select('#line_svg').node().getBoundingClientRect().x;
        svgy = w = d3.select('#line_svg').node().getBoundingClientRect().y;
        // console.log("w",w);

        xadj = svgx;
        yadj = svgy;
        lsvg.on("mouseover", function(event, i,d) {
            d3.select(this).style("stroke-width", "6");
            
        }) 
        .on("mousemove", function(event,i){
        //    console.log(d)
            yval = yScaleLine.invert(event.pageY-yadj)
            xval = xScaleLine.invert(event.pageX-xadj)
            xval = new Date(xval)
            xval = (xval.getDate()+"/"+xval.getMonth()+" "+xval.getHours()+":"+xval.getMinutes()+":"+xval.getSeconds())
            tooltip
                .html(i.id + "<br>" + "at " +xval + " value: " + yval.toFixed(2)).style("opacity", 1)
            tooltip.style("left", (event.pageX + 20) + "px") 
            .style("cursor", "pointer")
            .style("top", function(d){
                return (event.pageY - 20)  + "px"
             })
             .style("visibility","visible")
        })
        .on("mouseout", function(d, i){
            d3.select(this).style("stroke-width", "1.5");
            tooltip.style("opacity", 0)
            .style("visibility","hidden")
        })
        .on("click", function(event, i){
            yval = yScaleLine.invert(event.pageY-yadj)
            xval = xScaleLine.invert(event.pageX-xadj)
           // console.log("click",event.pageX,event.pageY)
            // d3.selectAll("path.data-line").style("stroke", "grey").style("opacity",0.6);
            if(prevSelectedLine!=null){
                updateLineColorOpacity(prevSelectedLine,"grey",0.6)
            }
            d3.selectAll(".click-circle").remove()
            // d3.select(this).style("stroke", "black").style("opacity",1);
            updateLineColorOpacity(this,"black",1)
            prevSelectedLine = this
            setlogs(i.id, xval)
            lineSvg.append("circle")
            .attr('class', 'click-circle')
            .attr("cx", event.pageX-xadj)
            .attr("cy", event.pageY-yadj)
            .attr("r", 5)
            .on("mouseover", function(a,b){
                //    console.log(d)
                    yval = yScaleLine.invert(event.pageY-yadj)
                    xval = xScaleLine.invert(event.pageX-xadj)
                    xval = new Date(xval)
                    xval = (xval.getDate()+"/"+xval.getMonth()+" "+xval.getHours()+":"+xval.getMinutes()+":"+xval.getSeconds())
                    tooltip
                        .html(i.id + "<br>" + "at " +xval + " value: " + yval.toFixed(2)).style("opacity", 1)
                    tooltip.style("left", (event.pageX) + 20 + "px") 
                    .style("cursor", "pointer")
                    .style("top", function(d){
                        return event.pageY - 20  + "px"
                     })
                     .style("visibility","visible")
                });
        });
        function updateLineColorOpacity(line, color, opc){
            d3.select(line).style("stroke", color).style("opacity",opc);
        }

    d3.selectAll(".nvtitle").remove()
    lineSvg.append("text")
    .attr("x", (lwidth / 2))             
    .attr("y", lmargin.top)
    .attr("text-anchor", "middle")  
    .style("font-size", "14px") 
    .attr("class","nvtitle")
    //.style("text-decoration", "underline")  
    .text("Metric Line Chart");
                
    }
    function getYLabelText(){
        let selected = d3.select("#selectattribute").property("value");
        if(selected == "cpu"){
            return "CPU Utilization (%)";
        }
        if(selected == "disk"){
            return "Disk Utilization (%)";
        }
        if(selected == "network"){
            return "Network Utilization (bytes/s)";
        }
        if(selected == "memory"){
            return "Memory Utilization (%)";
        }
    }
    function brushed({ selection }) {
        // extent gives us start and end time on x-axis.
        // let extent = selection.map(d => new Date(xScaleLine.invert(d)))
        if(!selection) return
        xMin = selection[0][0];
        yMin = selection[0][1];
        xMax = selection[1][0];
        yMax = selection[1][1];

         l = lineSvg.selectAll("path.data-line")
        //console.log("l",l)
        if (xMin === xMax && yMin === yMax) {
            // The selection box is empty
            //l.style("opacity", 1);
        }else{
            //l.style("opacity", 1);
            list_nodes = []
            l.filter(function (d) {
               // console.log(d)
                function findXIntersection(x) {
                    var lower = d.items.filter(v => x >= xScaleLine(v.timestamp))
                      .reduce((a, b) => a.timestamp >= b.timestamp ? a : b)
                    var upper = d.items.filter(v => x <= xScaleLine(v.timestamp))
                      .reduce((a, b) => a.timestamp >= b.timestamp ? b : a)
                    var lowerX = xScaleLine(lower.timestamp)
                    var lowerY = yScaleLine(lower.NodeValue)
                    var upperX = xScaleLine(upper.timestamp)
                    var upperY = yScaleLine(upper.NodeValue)
                    var a = (upperY - lowerY) / (upperX - lowerX)
                    var b = upperY - (a * upperX)
                    return (a * x) + b
                  }

                function findYIntersection(x,y) {
                    var lower = d.items.filter(v => x >= xScaleLine(v.timestamp))
                      .reduce((a, b) => a.timestamp >= b.timestamp ? a : b)
                    var upper = d.items.filter(v => x <= xScaleLine(v.timestamp))
                      .reduce((a, b) => a.timestamp >= b.timestamp ? b : a)
                    var lowerX = xScaleLine(lower.timestamp)
                    var lowerY = yScaleLine(lower.NodeValue)
                    var upperX = xScaleLine(upper.timestamp)
                    var upperY = yScaleLine(upper.NodeValue)
                    var a = (upperY - lowerY) / (upperX - lowerX)
                    var b = upperY - (a * upperX)
                    var inx = (y-b)/a;
                    if((inx>lowerX&&inx>upperX)||(inx<lowerX&&inx<upperX)){
                        return -1;
                    }
                    return inx;
                }
                
                var internalPoints = d.items.filter(
                  v => (xMin <= xScaleLine(v.timestamp)) && (xScaleLine(v.timestamp) <= xMax));

                // var resVal = internalPoints.filter(
                //     v=>(yMin<=yScaleLine(v.NodeValue)) && (yScaleLine(v.NodeValue)<=yMax));
                // if(resVal.length>0){
                //     list_nodes.push(d.id)
                //     return true;
                // }
                var pbelow = false;
                var pabove = false;
                for(var ip=0;ip<internalPoints.length;ip++){
                    nv = yScaleLine(internalPoints[ip].NodeValue);
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
                //console.log(yMin,yMax,xMinY,xMaxY)
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
               .style("stroke",colors[coloridx])
            setLines(list_nodes)
               
        }        
        
        // console.log("Selection",selection)
    }
    var coloridx = 0
    colors = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728"];
    function setLines(nodes){
        if(nodes.length<=0) return;
        res = {
            nodes: nodes,
            color: colors[coloridx],
            //selection: coloridx,
            start_time: prev_start_time,
            end_time: prev_end_time
        };
        updateSmallPlots(res)
        coloridx=(coloridx+1)%4;
    }
    function setlogs(id,timestamp){
        log_container.style.display = "flex"
        xval = new Date(timestamp)
        s = xval.getSeconds()
        xval = (xval.getDate()+"/"+xval.getMonth()+"/"+"2022"+" "+xval.getHours()+":"+xval.getMinutes())
        log = getlogs(id,xval)
        d3.select("#log").html("<b> Logs for " +id + ": </b><br>" +log)
    }
    function getlogs(id,timestamp){
        output = " No logs found for this Node at this Timestamp "
        for(var i=0;i<log_nodes.length;i++){
            if(log_nodes[i].id==id){
                for(var j=0;j<log_nodes[i].items.length;j++){
                    xval = log_nodes[i].items[j].timestamp
                    xval = (xval.getDate()+"/"+xval.getMonth()+"/"+"2022"+" "+xval.getHours()+":"+xval.getMinutes())
                    //console.log(xval,timestamp)
                    if(xval==timestamp){
                        //console.log(log_nodes[i].items[j].NodeValue)
                        output=""
                        for(var k=j;k>=Math.max(j-4,0);k--){
                            dval = log_nodes[i].items[k].timestamp
                            dval = (dval.getDate()+"/"+dval.getMonth()+"/"+"2022"+" "+dval.getHours()+":"+dval.getMinutes())
                            output = output +dval+ ": " +  log_nodes[i].items[k].NodeValue + "<br>"
                        }
                    }
                }
            }
        }
        //console.log(output)
        return output
    }
    addEventListener("resize", (event) => {
        // console.log("resizing...")
        updateChart();
    });
    function updateWindow(start_time,end_time){
        prev_start_time=start_time
        prev_end_time=end_time
        updateChart()
    }
    //update function
    function updateChart(){
        parseNodes(prev_start_time,prev_end_time)
        drawChart(prev_start_time,prev_end_time)
    }

    //list of node_number, start and end time, color, selection number.