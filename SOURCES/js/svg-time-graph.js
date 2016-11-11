/**
 * Class svgTimeGraph
 *
 **/
class svgTimeGraph {
    constructor(selector, width, height) {
	this.margins = [50, 20, 20, 80];
        this.legendspace_x = width/2;
	this.legendspace_y = this.margins[0]/4;
	this.mintime_s = 300; // display min. 10 minutes
	//this.ticktime_s = mintime_s / 5; // grid tick every 2 minutes
	this.width = width;
	this.height = height;
	this.color = d3.scaleOrdinal(d3.schemeCategory10);
	var xmin = Date.now() - this.mintime_s*1000;
	this.xrange = [new Date(xmin), new Date()];
	this.yrange = [0, 10];
	var svg_w = this.width + this.margins[1] + this.margins[3];
	var svg_h = this.height + this.margins[0] + this.margins[0];
	this.graph = d3.select(selector).append("svg:svg")
	    .attr("width", "100%").attr("preserveAspectRatio", "xMidYMid meet")
	    .attr("viewBox", "0 0 "+svg_w+" "+svg_h)
	    .append("svg:g").attr("transform", "translate(" + this.margins[3] + "," + this.margins[0] + ")");
	// Add the axis.
	this.graph.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")");
	this.graph.append("svg:g").attr("class", "y axis").attr("transform", "translate(0,0)");

	this.updateAxis();
	this.lines = [];
	this.labels = [];
        this.yAxisLogScale = 0;
    }

    setYAxisLogScale(enable) {
        if (enable) {
            this.yAxisLogScale = 1;
            this.yrange[0] = .1;
        } else {
            this.yAxisLogScale = 0;
            this.yrange[0] = 0;
        }
    }

    updateAxis() {
	var x = d3.scaleTime().domain(this.xrange).range([0, this.width]);
	var y = d3.scaleLinear().domain(this.yrange).range([this.height, 0]);
        if (this.yAxisLogScale) {
	    y = d3.scaleLog().domain(this.yrange).range([this.height, 0]);
        }
	var ticktime = +(this.mintime_s / 5); // always show ~5 ticks
	var format = "%H:%M";
	if (this.mintime_s < 300) {
	    format += ":%S";
	}
	var xAxis = d3.axisBottom().scale(x).tickSize(-this.height)
	    .tickFormat(d3.timeFormat(format)).ticks(d3.timeSecond.every(ticktime));
	var yAxis = d3.axisLeft().scale(y).tickSize(-this.width);
	if (this.yAxisLogScale) {
	    yAxis.tickFormat(d3.format("d"));
	}

	this.graph.select(".x.axis").call(xAxis);
	this.graph.select(".y.axis").call(yAxis);
	if (this.yAxisLogScale) {
	    var showTicks = [1,10,100,1000,10000];
	    var ticks = this.graph.selectAll(".y .tick text").filter(function(t) { return (showTicks.indexOf(t) > -1) ? null : this; }).remove();
	}
    }

    addYAxisLabel(label) {
	this.graph.append("text").attr("text-anchor", "middle")
	    .attr("transform", "translate("+ (-this.margins[3]/2) +","+(this.height/2)+")rotate(-90)")
	    .text(label);
    }

    addLine(index, label) {
        var yindex = (index % 4)+1;
        var xindex = index >> 2;
	this.graph.append("svg:path").attr("class", "line").attr("id", "line"+index)
	    .style("stroke", this.color(index));
	this.graph.append("text").attr("id", "label"+index).attr("visibility", "hidden")
            .attr("x", this.legendspace_x*xindex).style("fill", this.color(index))
	    .attr("y", -this.margins[0] + this.legendspace_y*yindex).text(label);
	this.lines.push({index:[]});
        this.labels[index] = label;
    }

    updateLine(index, xseq, yseq) {
	if (!xseq || !yseq || !xseq.length || !yseq.length) { return; }
	var tseqmin = xseq[0];
	var tseqmax = xseq[xseq.length-1];
	var tmin = new Date(tseqmax.getTime() - this.mintime_s*1000);
	var tindex = 0;
	for (tindex = 0; tindex < xseq.length; tindex++) {
	    if (xseq[tindex] >= tmin) { break; }
	}
	this.xrange[0] = tmin;
	this.xrange[1] = tseqmax;
	xseq = xseq.slice(tindex, xseq.length);
	yseq = yseq.slice(tindex, yseq.length);
	this.lines[index] = yseq;
	var ymax = 10;
	this.lines.forEach( function(line) {
	    var max = d3.max(line);
	    if (max > ymax) {
		ymax = max;
	    }
	});
	this.yrange[1] = (this.yAxisLogScale) ? 10*ymax : 1.2*ymax;

	var x = d3.scaleTime().domain(this.xrange).range([0, this.width]);
	var y = d3.scaleLinear().domain(this.yrange).range([this.height, 0]);
        if (this.yAxisLogScale) {
	    y = d3.scaleLog().domain(this.yrange).range([this.height, 0]);
        }
	var yrange = this.yrange;
	var drawline = d3.line()
	    .defined(function(d) { return d>-1; })
	    .x(function(d,i) { return x(xseq[i]); })
	    .y(function(d,i) { return (d < yrange[0]) ? y(yrange[0]) : y(d); })
	this.graph.select("#line"+index).attr("d", drawline(yseq));

        // show/hide label
        if (d3.max(yseq) <= 0) {
            this.graph.select("#label"+index).attr("visibility", "hidden");
        } else {
            this.graph.select("#label"+index).attr("visibility", "unset");
            this.graph.select("#label"+index).text(this.labels[index] + ": " + yseq[yseq.length-1]);
        }

	this.updateAxis();
    }
}
