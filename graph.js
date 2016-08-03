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

var graph_pendingEvents = new svgTimeGraph("#maxPendingEvents", 600, 300)
graph_pendingEvents.addYAxisLabel("Number of Events");
graph_pendingEvents.addLine(0, "Max Pending Output Events");
graph_pendingEvents.addLine(1, "Max Pending Input Events");

var graph_hltDataRate = new svgTimeGraph("#hltDataRate", 600, 300);
graph_hltDataRate.addYAxisLabel("Data Rate [MB/s]");
graph_hltDataRate.addLine(0, "HLT Input Data Rate");
graph_hltDataRate.addLine(1, "HLT Output Data Rate");

var graph_hltEventRate = new svgTimeGraph("#hltEventRate", 600, 300);
graph_hltEventRate.addYAxisLabel("Event Rate [MB/s]");
graph_hltEventRate.addLine(0, "HLT Input Event Rate");
graph_hltEventRate.addLine(1, "HLT Output Event Rate");

var text_runNumber = addText("#runNumber", "RunNumber UNKNOWN");
var tbl_maxPendingOutputComponents = addTable("#maxPendingOutputComponents");
var tbl_maxPendingInputComponents = addTable("#maxPendingInputComponents");
//var text_hltLogMessages = addText("#hltLogMessages", "");
var tbl_logMessages = addTable("#logMessages", ['Timestamp', 'Facility', 'Message']);
var maxLogMessages = 25;
var tbl_minFreeOutputBuffer = addTable("#minFreeOutputBuffer");


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

function addTable(selector, headers) {
    var t = d3.select(selector).append("table")
	.attr("class", "table table-condensed table-striped table-bordered");
    th = t.select("thead");
    if (th.empty()) {
	th = t.append("thead").append("tr");
    }
    for (var i in headers) {
	th.append("th").text(headers[i]);
    }
    td = t.select("tbody");
    if (td.empty()) {
	td = t.append("tbody");
    }
    return td;
}

function getField(obj, key, default_value) {
    if (!obj) {
	return default_value;
    }
    if (obj.hasOwnProperty(key)) {
	return obj[key];
    } else {
	return default_value;
    }
}

function drawgraphs(){
    // get new data from jsonUrl
    d3.json(jsonUrl, function(error, data){
	if (error) {
	    var msg_obj = { 'facility':"hlt-status-gui", 'severity':"e",
			    'msg':"Failed to retrieve JSON data from "+jsonUrl };
	    addLogMessage(tbl_logMessages, msg_obj);
	}

	text_runNumber.text("Run Number: "+getField(data, 'runNumber', "UNKNOWN"));

	// convert time string to date
	var time = getField(data, 'time', []);
	for (var i = 0; i < time.length; i++) {
	    time[i] = new Date(time[i] * 1000);
	}
	if (time.length) {
	    //max # of Events in Chain
	    graph_pendingEvents.updateLine(0, time, data.maxPendingOutputEventCount);
	    graph_pendingEvents.updateLine(1, time, data.maxPendingInputEventCount);

	    // Data Rates
	    graph_hltDataRate.updateLine(0, time, data.hltInputDataRate);
	    graph_hltDataRate.updateLine(1, time, data.hltOutputDataRate);

	    // Event Rates
	    graph_hltEventRate.updateLine(0, time, data.hltInputEventRate);
	    graph_hltEventRate.updateLine(1, time, data.hltOutputEventRate);

	    fillTable(tbl_maxPendingOutputComponents, data.maxPendingOutputComponents, "PendingOutputEventCount");
	    fillTable(tbl_maxPendingInputComponents, data.maxPendingInputComponents, "PendingInputEventCount");
	    fillTable(tbl_minFreeOutputBuffer, data.minFreeOutputBuffer, "minFreeOutputBuffer");
	}
    });
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

function addLogMessage(inst, msg) {
    var msgclass = severity2bootstrap(msg['severity']);
    var date = new Date();
    // remove old entries
    var msgs = inst.selectAll("tr");
    var n_msgs = msgs[0].length;
    if (n_msgs ==  maxLogMessages) {
	msgs[0][n_msgs - 1].remove();
    }
    // add new entry
    var line = inst.insert("tr", ":first-child");
    line.append("td").classed(msgclass, true).text(date.toLocaleTimeString());
    line.append("td").classed(msgclass, true).text(msg['facility']);
    line.append("td").classed(msgclass, true).text(msg['msg']);
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

drawgraphs();
