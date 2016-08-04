/**
 * Class svgTimeGraph
 *
 **/
class svgTimeGraph {
    constructor(selector, width, height) {
	this.margins = [20, 20, 20, 80];
	this.legendspace = 20;
	this.mintime_s = 600; // display min. 10 minutes
	this.ticktime_min = 2; // grid tick every 2 minutes
	this.width = width;
	this.height = height;
	this.color = d3.scale.category10();
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
    }

    updateAxis() {
	var x = d3.time.scale().domain(this.xrange).range([0, this.width]);
	var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
	var xAxis = d3.svg.axis().scale(x).tickSize(-this.height)
	    .tickFormat(d3.time.format("%H:%M:%S")).ticks(d3.time.minutes, this.ticktime_min);
	var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(-this.width);

	this.graph.select(".x.axis").call(xAxis);
	this.graph.select(".y.axis").call(yAxis);
    }

    addYAxisLabel(label) {
	this.graph.append("text").attr("text-anchor", "middle")
	    .attr("transform", "translate("+ (-this.margins[3]/2) +","+(this.height/2)+")rotate(-90)")
	    .text(label);
    }

    addLine(index, label) {
	this.graph.append("svg:path").attr("class", "line").attr("id", "line"+index)
	    .style("stroke", this.color(index));
	this.graph.append("text").attr("id", "label"+index).attr("x", 0).style("fill", this.color(index))
	    .attr("y", this.legendspace*index).text(label);
	this.lines.push({index:[]});
    }

    updateLine(index, xseq, yseq) {
	if (!xseq.length || !yseq.length) { return; }
	this.lines[index] = yseq;
	var tseqmin = xseq[0];
	var tseqmax = xseq[xseq.length-1];
	var tmin = new Date(tseqmax.getTime() - this.mintime_s*1000);
	this.xrange[0] = d3.min([tmin, tseqmin]);
	this.xrange[1] = tseqmax;
	var ymax = 10;
	this.lines.forEach( function(line) {
	    var max = d3.max(line);
	    if (max > ymax) {
		ymax = max;
	    }
	});
	this.yrange[1] = 1.2*ymax;

	var x = d3.time.scale().domain(this.xrange).range([0, this.width]);
	var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
	var drawline = d3.svg.line()
	    .x(function(d,i) { return x(xseq[i]); })
	    .y(function(d,i) { return y(d); })
	this.graph.select("#line"+index).attr("d", drawline(yseq));
	this.updateAxis();
    }
}