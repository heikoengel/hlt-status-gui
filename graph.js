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
var jsonUrl = "http://localhost:8080";

var graph_pendingEvents = new svgTimeGraph("#maxPendingEvents", 400, 200)
graph_pendingEvents.addYAxisLabel("Number of Events");
graph_pendingEvents.addLine(0, "Max Pending Output Events");
graph_pendingEvents.addLine(1, "Max Pending Input Events");

var graph_hltDataRate = new svgTimeGraph("#hltDataRate", 400, 200);
graph_hltDataRate.addYAxisLabel("Data Rate [MB/s]");
graph_hltDataRate.addLine(0, "HLT Input Data Rate");
graph_hltDataRate.addLine(1, "HLT Output Data Rate");

var graph_hltEventRate = new svgTimeGraph("#hltEventRate", 400, 200);
graph_hltEventRate.addYAxisLabel("Event Rate [MB/s]");
graph_hltEventRate.addLine(0, "HLT Input Event Rate");
graph_hltEventRate.addLine(1, "HLT Output Event Rate");

var tbl_maxPendingOutputComponents = addTable("#maxPendingOutputComponents");
var tbl_maxPendingInputComponents = addTable("#maxPendingInputComponents");
var tbl_logMessages = addTable("#logMessages", ['Timestamp', 'Facility', 'Message']);
var maxLogMessages = 25;
var tbl_minFreeOutputBuffer = addTable("#minFreeOutputBuffer");

var alert_messages = d3.select("#messages");
var tbl_procStats = d3.select("#procStats");
var tbl_frameworkStats = d3.select("#frameworkStats");

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

	var msgs = getField(data, 'messages', []);
	updateStatusMessage(alert_messages, error, msgs);
	msgs.forEach( function(m) {
	    addLogMessage(tbl_logMessages, m);
	});
	updateStats(tbl_procStats, getField(data, "proc_stats", []));
	updateStats(tbl_frameworkStats, getField(data, "framework_stats", []));

	// convert time string to date
	var time = getField(data, 'seq_time', []);
	for (var i = 0; i < time.length; i++) {
	    time[i] = new Date(time[i] * 1000);
	}
	if (time.length) {
	    //max # of Events in Chain
	    graph_pendingEvents.updateLine(0, time, data.seq_maxPendingInputEventCount);
	    graph_pendingEvents.updateLine(1, time, data.seq_maxPendingOutputEventCount);

	    // Data Rates
	    graph_hltDataRate.updateLine(0, time, data.seq_hltInputDataRate);
	    graph_hltDataRate.updateLine(1, time, data.seq_hltOutputDataRate);

	    // Event Rates
	    graph_hltEventRate.updateLine(0, time, data.seq_hltInputEventRate);
	    graph_hltEventRate.updateLine(1, time, data.seq_hltOutputEventRate);

	    //fillTable(tbl_maxPendingOutputComponents, data.maxPendingOutputComponents, "PendingOutputEventCount");
	    //fillTable(tbl_maxPendingInputComponents, data.maxPendingInputComponents, "PendingInputEventCount");
	    //fillTable(tbl_minFreeOutputBuffer, data.minFreeOutputBuffer, "minFreeOutputBuffer");
	}
    });
}

function updateStats(instance, stats) {
    instance.selectAll("*").remove();
    for (var key in stats) {
	var name = stats[key].name;
	var val = stats[key].value;
	var row = instance.append("tr");
	if (typeof val == "object") {
	    row.append("td").text(name);
	    row.append("td").text(val.min).style("text-align", "center");
	    row.append("td").text(val.avg).style("text-align", "center");
	    row.append("td").text(val.max).style("text-align", "center");
	} else {
	    row.append("td").text(name);
	    row.append("td").attr("colspan", "3").text(val).style("text-align", "center");
	}
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

function updateStatusMessage(inst, error, msg) {
    inst.selectAll("*").remove();
    if (error) {
	inst.append("div").classed("alert alert-danger", true)
	    .text("Failed to retrieve JSON data from "+jsonUrl);
    } else if (msg.length) {
	msg.forEach( function(m) {
	    inst.append("div").classed("alert "+severity2bootstrap(m['severity']), true)
		.text(m['msg']);
	});
    }
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
