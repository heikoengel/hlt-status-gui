/**
* Class svgBarHistogram
*
**/

class svgBarHistogram {
    constructor(selector, width, height) {
        this.margins = [20, 20, 20, 80];
        this.width = width;
        this.height = height;
        this.color = d3.scale.category10();
        this.xrange = [0, 100];
        this.yrange = [0, 100];
        var svg_w = this.width + this.margins[1] + this.margins[3];
        var svg_h = this.height + this.margins[0] + this.margins[0];
        this.graph = d3.select(selector).append("svg:svg")
            .attr("width", "100%").attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 "+svg_w+" "+svg_h)
            .append("svg:g").attr("transform", "translate(" + this.margins[3] + "," + this.margins[0] + ")");
        // Add the axis.
        this.graph.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")");
        this.graph.append("svg:g").attr("class", "y axis").attr("transform", "translate(0,0)");
        this.numBins = 100;
        this.updateAxis();
    }

    updateAxis() {
        var x = d3.scale.linear().domain(this.xrange).range([0, this.width]);
        var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom");
        var yAxis = d3.svg.axis().scale(y).orient("left");
        this.graph.select(".x.axis").call(xAxis);
        this.graph.select(".y.axis").call(yAxis);
    }

    update(data_in) {
        if (!data_in) { return; }
        this.yrange = [0, 1.2*data_in.length];
        var x = d3.scale.linear().domain(this.xrange).range([0, this.width]);
        var y = d3.scale.linear().domain(this.yrange).range([this.height, 0]);
        this.updateAxis();
        //y.domain([0, d3.max(data, function(d) { return d.y; })]).range([this.height, 0]);
        var histogram = d3.layout.histogram().bins(this.numBins);
        var data = histogram(data_in);
        var bar = this.graph.selectAll(".bar").data(data);
        bar.enter().append("rect").attr("class", "bar");
        bar.exit().remove();
        var nbins = this.numBins;
        bar.transition()
            .attr("width", ((x.range()[1] - x.range()[0]) / nbins) )
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("height", function(d) { ; return y.range()[0] - y(d.y); });
    }
}
