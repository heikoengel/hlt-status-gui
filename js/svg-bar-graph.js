/**
* Class svgBarGraph
*
**/

class svgBarGraph {
    constructor(selector, width, height) {
        this.margins = [20, 20, 60, 80];
        this.width = width;
        this.height = height;
        this.color = d3.scale.category10();
        this.xrange = [0, 100];
        this.yrange = [0, 100];
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
        var x = d3.scale.linear().domain(this.xrange).range([0, this.width]);
        var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
        var xAxis = d3.svg.axis().scale(x).tickSize(-this.height).orient("bottom").ticks(10);
        var yAxis = d3.svg.axis().scale(y).tickSize(-this.width).orient("left").ticks(10);
        this.graph.select(".x.axis").call(xAxis);
        this.graph.select(".y.axis").call(yAxis);
    }

    update(data) {
        if (!data) { return; }
        this.yrange = [0, 1.2*d3.sum(data, function(d) { return d.value; })];
        this.updateAxis();
        var x = d3.scale.linear().domain(this.xrange).range([0, this.width]);
        var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
        var height = this.height;
        var width = this.width;
        var bars = this.graph.selectAll(".bar").data(data, function(d) { return d.x; });
        bars.exit().attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { ; return height - y(d.value); })
            .remove();
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { ; return height - y(d.value); });
        bars.transition()
            .attr("x", function(d, i) { return x(d.x); })
            .attr("width", width/100)
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { ; return height - y(d.value); });
    }
}
