/**
* Class svgBarGraph
*
**/

class svgBarGraph {
    constructor(selector, width, height) {
        this.margins = [20, 20, 60, 80];
        this.width = width;
        this.height = height;
        this.color = d3.scaleOrdinal(d3.schemeCategory10);
        this.xrange = [0, 100];
        this.yrange = [0, 100];
        this.yAxisLogScale = 0;
        var svg_w = this.width + this.margins[1] + this.margins[3];
        var svg_h = this.height + this.margins[0] + this.margins[2];
        this.graph = d3.select(selector).append("svg:svg")
            .attr("width", "100%").attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 "+svg_w+" "+svg_h)
            .append("svg:g").attr("transform", "translate(" + this.margins[3] + "," + this.margins[0] + ")");
        // Add the axis.
        this.graph.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")");
        this.graph.append("svg:g").attr("class", "y axis").attr("transform", "translate(0,0)");

        this.updateAxis();
    }

    setYAxisLogScale(enable) {
        if (enable) {
            this.yAxisLogScale = 1;
            this.yrange[0] = .1;
        } else {
            this.yAxisLogScale = 0;
            this.yrange = 0;
        }
    }

    addYAxisLabel(label) {
	this.graph.append("text").attr("text-anchor", "middle")
	    .attr("transform", "translate("+ (-this.margins[3]/2) +","+(this.height/2)+")rotate(-90)")
	    .text(label);
    }

    addXAxisLabel(label) {
	this.graph.append("text").attr("text-anchor", "middle")
	    .attr("transform", "translate("+ (this.width/2) +","+(this.height + this.margins[2]/2)+")")
	    .text(label);
    }

    updateAxis() {
        var x = d3.scaleLinear().domain(this.xrange).range([0, this.width]);
        var y = d3.scaleLinear().domain(this.yrange).range([this.height, 0]);
        if (this.yAxisLogScale) {
	    y = d3.scaleLog().domain(this.yrange).range([this.height, 0]);
         }
        var xAxis = d3.axisBottom().scale(x).tickSize(-this.height).ticks(10);
        var yAxis = d3.axisLeft().scale(y).tickSize(-this.width).ticks(10);
	if (this.yAxisLogScale) {
	    yAxis.tickFormat(d3.format("d"));
	}
        this.graph.select(".x.axis").call(xAxis);
        this.graph.select(".y.axis").call(yAxis);
	if (this.yAxisLogScale) {
	    var showTicks = [1,10,100,1000,10000,100000,1000000];
	    var ticks = this.graph.selectAll(".y .tick text").filter(function(t) { return (showTicks.indexOf(t) > -1) ? null : this; }).remove();
	}
    }

    update(data) {
        if (!data) { return; }
        var sum = d3.sum(data, function(d) { return d.value; });
        this.yrange[1] = (this.yAxisLogScale) ? 10*sum : 1.2*sum;
        this.updateAxis();
        var x = d3.scaleLinear().domain(this.xrange).range([0, this.width]);
        var y = d3.scaleLinear().domain(this.yrange).range([this.height, 0]);
        if (this.yAxisLogScale) {
	    y = d3.scaleLog().domain(this.yrange).range([this.height, 0]);
         }
        var height = this.height;
        var width = this.width;
        var yrange = this.yrange;
        var bars = this.graph.selectAll(".bar").data(data, function(d) { return d.x; });
        bars.exit().attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { ; return height - y(d.value); })
            .remove();
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("y", function(d) { return (d.value > yrange[0]) ? y(d.value) : y(yrange[0]); })
            .attr("height", function(d) { return (d.value > yrange[0]) ? (height - y(d.value)) : (height - y(yrange[0])); });
        bars.transition()
            .attr("x", function(d, i) { return x(d.x); })
            .attr("width", width/100)
            .attr("y", function(d) { return (d.value > yrange[0]) ? y(d.value) : y(yrange[0]); })
            .attr("height", function(d) { return (d.value > yrange[0]) ? (height - y(d.value)) : (height - y(yrange[0])); });
    }
}
