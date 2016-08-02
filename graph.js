/**
 *
 * graph.js
 *
 * use d3.js to print JSON data from ComponentStatusMonitor.py
 *
 * Revisions:
 * 0.1  Aug. 2016       hengel          Initial Version
 *
 **/
var jsonUrl = "http://cn58:8080";

// define dimensions of graph
var m = [20, 20, 20, 80]; // margins
var w = 600 - m[1] - m[3]; // width
var h = 300 - m[0] - m[2]; // height 

var x_range;
var y_range;

var graph_pendingEvents = createTimeSequenceSvq("#maxPendingEvents", 2, "Number of Events");
var graph_hltDataRate = createTimeSequenceSvq("#hltDataRate", 2, "Data Rate [MB/s]");
var graph_hltEventRate = createTimeSequenceSvq("#hltEventRate", 2, "Event Rate [Hz]");
var text_runNumber = addText("#runNumber", "RunNumber UNKNOWN");
var tbl_maxPendingOutputComponents = addTable("#maxPendingOutputComponents");
var tbl_maxPendingInputComponents = addTable("#maxPendingInputComponents");
var text_hltLogMessages = addText("#hltLogMessages", "");
var tbl_minFreeOutputBuffer = addTable("#minFreeOutputBuffer");

// auto-update every 2s
var inter = setInterval(function() {
  drawgraphs();
}, 2000);

function toggleInterval() {
  var ctrlbtn = d3.select("#ctrlButton");
  var state = 1;
  var b = ctrlbtn.select(".btn-danger");
  if (ctrlbtn.select(".btn-danger").empty()) {
    b = ctrlbtn.select(".btn-success");
    state = 0;
  }

  if (state == 0) {
    console.log("Resuming...");
    inter = setInterval( function() { drawgraphs(); }, 2000);
    b.classed("btn-success", false);
    b.classed("btn btn-danger pull-right", true);
    b.text("Freeze");
    b.on('click', toggleInterval);
    drawgraphs();
  } else {
    console.log("Stopping...");
    clearInterval(inter);
    b.classed("btn btn-success pull-right", true);
    b.classed("btn-danger", false);
    b.text("Resume");
    b.on('click', toggleInterval);
  }
}


function addText(selector, text) {
  var t = d3.select(selector).
    append("div").text(text);
  return t;
}

var titleDict = { "PendingInputEventCount" : "# of Pending Inputs",
  "CurrentProcessedEventCount" : "Process Rate", 
  "PendingOutputEventCount" : "# of Pending Outputs",
  "name" : "Component Name",
  "minFreeOutputBuffer" : "Free Output Buffer %" };

function addTable(selector) {
  var t = d3.select(selector).append("table")
    .attr("class", "table table-condensed table-striped table-bordered");
  return t;
}

function createTimeSequenceSvq(selector, nlines, yaxislabel){
  // Add an SVG element with the desired dimensions and margin.
  var svg_w = w + m[1] + m[3];
  var svg_h = h + m[0] + m[2];
  var g = d3.select(selector).append("svg:svg")
    .attr("width", "100%").attr("preserveAspectRatio", "xMidYMid meet")
    .attr("viewBox", "0 0 "+svg_w+" "+svg_h)
    .append("svg:g").attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  // Add the axis.
  g.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + h + ")");
  g.append("svg:g").attr("class", "y axis").attr("transform", "translate(0,0)");
  g.append("text").attr("text-anchor", "middle")
    .attr("transform", "translate("+ (-m[3]/2) +","+(h/2)+")rotate(-90)").text(yaxislabel);

  var color = d3.scale.category10();
  var legendspace = 20;
  for (var i=0; i<nlines; i++) {
    // line
    g.append("svg:path").attr("class", "line").attr("id", "line"+i)
      .style("stroke", color(i));
    // label
    g.append("text").attr("id", "label"+i).attr("x", 0).style("fill", color(i))
      .attr("y", legendspace*i).text("");
  }
  return g;
}

function drawgraphs(){    
  // get new data from jsonUrl
  d3.json(jsonUrl, function(error, data){
    printJsonErrors(".messages", error);

    // convert time string to date
    var time = data.time;
    for (var i = 0; i < time.length; i++) {
      //time[i] = parseDate.parse(time[i]);
      time[i] = d3.time.format("%H:%M:%S").parse(time[i]);
    }
    //max # of Events in Chain
    renderInto(graph_pendingEvents, 0, time, data.maxPendingOutputEventCount, d3.max(data.maxPendingOutputEventCount), "Max Pending Output Events");
    renderInto(graph_pendingEvents, 1, time, data.maxPendingInputEventCount, d3.max(data.maxPendingOutputEventCount), "Max Pending Input Events");

    // Data Rates
    renderInto(graph_hltDataRate, 0, time, data.hltInputDataRate, d3.max(data.hltInputDataRate), "HLT Input Data Rate");
    renderInto(graph_hltDataRate, 1, time, data.hltOutputDataRate, d3.max(data.hltInputDataRate), "HLT Output Data Rate");

    // Event Rates
    renderInto(graph_hltEventRate, 0, time, data.hltInputEventRate, d3.max(data.hltInputEventRate), "HLT Input Event Rate");
    renderInto(graph_hltEventRate, 1, time, data.hltOutputEventRate, d3.max(data.hltOutputEventRate), "HLT Output Event Rate");

    text_runNumber.text("Run Number: "+data.runNumber);
    fillTable(tbl_maxPendingOutputComponents, data.maxPendingOutputComponents, "PendingOutputEventCount");
    fillTable(tbl_maxPendingInputComponents, data.maxPendingInputComponents, "PendingInputEventCount");
    fillTable(tbl_minFreeOutputBuffer, data.minFreeOutputBuffer, "minFreeOutputBuffer");
    printHltLogMessages(text_hltLogMessages, data.hltmessages);
  });
}

function printJsonErrors(selector, error) {
  var errmsg = d3.select(selector).select(".alert");
  if (error) {
    if (errmsg.empty()) {
      d3.select(".messages").append("div").attr("class", "alert alert-danger");
      errmsg = d3.select(".messages").select(".alert");
    }
    errmsg.text("Error: Failed to read JSON data from "+jsonUrl+" - error: "+error);
    console.warn(error);
    return
  }
  if (!errmsg.empty()) {
    errmsg.remove();
  }
}

// convert infologger severity to corresponding bootstrap class
function severity2bootstrap(s) {
  switch (s) {
    case 'f': return "alert-danger";
    case 'e': return "alert-danger";
    case 'w': return "alert-warning";
    case 'i': return "alert-info";
    default: return "";
  }
}

function printHltLogMessages(textinst, messages) {
  textinst.selectAll("*").remove();
  if (messages.length <= 0) { return; }

  messages.forEach( function(d) {
    var msgclass = "alert "+severity2bootstrap(d['severity']);
    var text = d['facility']+": "+d['msg'];
    textinst.append("div").attr("class", msgclass).text(text);
  });
}


function fillTable(t, data, primarykey) {
  th = t.select("thead");
  if (th.empty() && data.length >= 1) {
    th = t.append("thead").append("tr");
    for (var key in data[0]) {
      var title = key;
      if (key in titleDict) {
        title = titleDict[key];
      }
      th.append("td").text(title);
    }
  }
  td = t.select("tbody");
  if (td.empty()) {
    td = t.append("tbody");
  }
  td.selectAll("*").remove();

  data.forEach( function(d) {
    var row = td.append("tr");
    var vals = d;
    for (var key in d) {
      row.append("td").text(d[key]);
    }
  });
}

function renderInto(graph, lineno, xseq, yseq, ymax, label) {
  if (ymax < 10) { ymax = 10; }
  var xrange = [ d3.min(xseq), d3.max(xseq) ];
  var yrange = [ 0, 1.2 * ymax ];
  var x = d3.time.scale().domain(xrange).range([0, w]);
  var y = d3.scale.linear().domain(yrange).range([h, 0]);
  var drawline = d3.svg.line()
    .x(function(i) { return x(xseq[i]); })
    .y(function(i) { return y(yseq[i]); })
    var xAxis = d3.svg.axis().scale(x).tickSize(-h)
    .tickFormat(d3.time.format("%H:%M:%S")).ticks(d3.time.minutes, 1);
  graph.select(".x.axis").call(xAxis);
  var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(-w);
  graph.select(".y.axis").call(yAxis);
  var nvals = Object.keys(xseq);
  graph.select("#line"+lineno).attr("d", drawline(nvals));
  graph.select("#label"+lineno).text(label);
}

drawgraphs();
