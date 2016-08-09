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
var default_host = "ecs0";
var default_port = "8080";
var default_tab = "main";

var host = getParameterByName('host');
if (!host) { host = default_host; }
if (!(host.match(/http:\/\//))) {
    host = "http://"+host;
}
var port = getParameterByName('port');
if (!port) { port = default_port; }

var jsonUrl = host + ":" + port;
var active_tab = default_tab;

var default_graph_time_range = 600;

var graph_pendingEvents = new svgTimeGraph("#maxPendingEvents", 400, 200)
graph_pendingEvents.addYAxisLabel("Number of Events");
graph_pendingEvents.addLine(0, "Max Pending Input Events");
graph_pendingEvents.addLine(1, "Max Pending Output Events");

var graph_hltDataRate = new svgTimeGraph("#hltDataRate", 400, 200);
graph_hltDataRate.addYAxisLabel("Data Rate [MB/s]");
graph_hltDataRate.addLine(0, "HLT Input Data Rate");
graph_hltDataRate.addLine(1, "HLT Output Data Rate");

var graph_hltEventRate = new svgTimeGraph("#hltEventRate", 400, 200);
graph_hltEventRate.addYAxisLabel("Event Rate [Hz]");
graph_hltEventRate.addLine(0, "HLT Input Event Rate");
graph_hltEventRate.addLine(1, "HLT Output Event Rate");

var graph_avgEventSize = new svgTimeGraph("#avgEventSize", 400, 200);
graph_avgEventSize.addYAxisLabel("Average Event Size [kB]");
graph_avgEventSize.addLine(0, "HLT Input Average Event Size");
graph_avgEventSize.addLine(1, "HLT Output Average Event Size");

var graph_bufferStats = new svgBarGraph("#bufferStats", 800, 300);
graph_bufferStats.addYAxisLabel("Number of Components");
graph_bufferStats.addXAxisLabel("Percentage of Output Buffer Usage");
graph_bufferStats.setYAxisLogScale(1);

var graph_detectorEventRate = new svgTimeGraph("#detectorEventRate", 400, 200);
graph_detectorEventRate.addYAxisLabel("Event Rate [Hz]");
graph_detectorEventRate.addLine(0, "TPC Input Event Rate");
graph_detectorEventRate.addLine(1, "SPD Input Event Rate");
graph_detectorEventRate.addLine(2, "SSD Input Event Rate");
graph_detectorEventRate.addLine(3, "SDD Input Event Rate");
graph_detectorEventRate.addLine(4, "EMCAL Input Event Rate");

var graph_detectorDataRate = new svgTimeGraph("#detectorDataRate", 400, 200);
graph_detectorDataRate.addYAxisLabel("Data Rate [MB/s]");
graph_detectorDataRate.addLine(0, "TPC Input Data Rate");
graph_detectorDataRate.addLine(1, "SPD Input Data Rate");
graph_detectorDataRate.addLine(2, "SSD Input Data Rate");
graph_detectorDataRate.addLine(3, "SDD Input Data Rate");
graph_detectorDataRate.addLine(4, "EMCAL Input Data Rate");
graph_detectorDataRate.setYAxisLogScale(1);

var tbl_maxPendingInputsComponents = d3.select("#maxPendingInputsComponents");
var tbl_maxPendingInputsMergers = d3.select("#maxPendingInputsMergers");
var tbl_maxPendingInputsBridges = d3.select("#maxPendingInputsBridges");
var tbl_logMessages = addTable("#logMessages", ['Timestamp', 'Facility', 'Message']);
var maxLogMessages = 25;

var text_status = d3.select("#status");
var tbl_procStats = d3.select("#procStats");
var tbl_frameworkStats = d3.select("#frameworkStats");

function updateMintime(time) {
    graph_pendingEvents.mintime_s = time;
    graph_hltDataRate.mintime_s = time;
    graph_hltEventRate.mintime_s = time;
    graph_avgEventSize.mintime_s = time;
    drawgraphs();
}

function zoomIn() {
    mintime = graph_pendingEvents.mintime_s;
    if (mintime <= 10) { mintime = 10; }
    else { mintime = mintime / 2; }
    updateMintime(mintime);
}

function zoomOut() {
    mintime = graph_pendingEvents.mintime_s;
    if (mintime >= default_graph_time_range) { mintime = default_graph_time_range; }
    else { mintime = mintime * 2; }
    updateMintime(mintime);
}

function zoomReset() {
    updateMintime(default_graph_time_range);
}

function addText(selector, text) {
  var t = d3.select(selector).
    append("div").text(text);
  return t;
}

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
	var status = "online";
	if (error) {
	    var msg_obj = { 'facility':"hlt-status-gui", 'severity':"e",
			    'msg':"Failed to retrieve JSON data from "+jsonUrl };
	    addLogMessage(tbl_logMessages, msg_obj);
	    status = "offline";
	}

	var msgs = getField(data, 'messages', []);
	if (msgs.length) {
	    status = "warning";
	}
	msgs.forEach( function(m) {
	    addLogMessage(tbl_logMessages, m);
	});

	updateStatus(text_status, status);

	// convert time string to date
	var time = getField(data, 'seq_time', []);
	for (var i = 0; i < time.length; i++) {
	    time[i] = new Date(time[i] * 1000);
	}

	if (active_tab == "main") {
	    updateStats(tbl_procStats, getField(data, "proc_stats", []));
	    updateStats(tbl_frameworkStats, getField(data, "framework_stats", []));
	    updateStats(tbl_maxPendingInputsComponents, getField(data, "list_maxPendingInputsComponents", []));
	    updateStats(tbl_maxPendingInputsMergers, getField(data, "list_maxPendingInputsMergers", []));
	    updateStats(tbl_maxPendingInputsBridges, getField(data, "list_maxPendingInputsBridges", []));

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

		// Average Event Sizes
		graph_avgEventSize.updateLine(0, time, data.seq_hltInputAvgEventSize);
		graph_avgEventSize.updateLine(1, time, data.seq_hltOutputAvgEventSize);
	    }
	}
        if (active_tab == "bufferstats") {
            var componentStats = getField(data, "component_stats", []);
            var bufferUsage = getField(componentStats, "hist_bufferUsage", []);
            bufferstats = [];
            var index = 0;
            for(var i = 0; i < bufferUsage.length; i++) {
                bufferstats[i] = {'x': i, 'value':bufferUsage[i]};
            }
            graph_bufferStats.update(bufferstats);
        }
	if (active_tab == "detectorstats") {
	    if (time.length) {
		graph_detectorEventRate.updateLine(0, time, data.seq_tpcInputEventRate);
		graph_detectorEventRate.updateLine(1, time, data.seq_itsspdInputEventRate);
		graph_detectorEventRate.updateLine(2, time, data.seq_itsssdInputEventRate);
		graph_detectorEventRate.updateLine(3, time, data.seq_itssddInputEventRate);
		graph_detectorEventRate.updateLine(4, time, data.seq_emcalInputEventRate);

		graph_detectorDataRate.updateLine(0, time, data.seq_tpcInputDataRate);
		graph_detectorDataRate.updateLine(1, time, data.seq_itsspdInputDataRate);
		graph_detectorDataRate.updateLine(2, time, data.seq_itsssdInputDataRate);
		graph_detectorDataRate.updateLine(3, time, data.seq_itssddInputDataRate);
		graph_detectorDataRate.updateLine(4, time, data.seq_emcalInputDataRate);
	    }
	}
    });
}

function updateStats(instance, stats) {
    instance.selectAll("*").remove();
    for(var i=0; i<stats.length; i++) {
	var name = stats[i].name;
	var shortname = name;
	if (name.length > 50) {
	    shortname = name.slice(0,50)+"...";
	}
	var val = stats[i].value;
	var row = instance.append("tr");
	if (typeof val == "object") {
	    row.append("td").attr("title", name).text(shortname);
	    row.append("td").text(val.min);
	    row.append("td").text(val.avg);
	    row.append("td").text(val.max);
	} else {
	    row.append("td").attr("title", name).text(shortname);
	    row.append("td").attr("colspan", "3").text(val);
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
    inst.selectAll("tr").filter(function(d, i) { return (i >= (maxLogMessages-1)) ? this : null; }).remove();
    // add new entry
    var line = inst.insert("tr", ":first-child");
    line.append("td").classed(msgclass, true).text(date.toLocaleTimeString());
    line.append("td").classed(msgclass, true).text(msg['facility']);
    line.append("td").classed(msgclass, true).text(msg['msg']);
}

function updateStatus(inst, status) {
    switch (status) {
    case "offline":
	inst.attr("class", "alert alert-danger").text("Offline");
	break;
    case "warning":
	inst.attr("class", "alert alert-warning").text("No connection to TaskManager");
	break;
    case "online":
	inst.attr("class", "alert alert-success").text("Online");
	break;
    default:
	inst.attr("class", "alert alert-info").text("UNKOWN");
	break;
    }
}

/**
* parse URL GET parameters
* jolly.exe, https://stackoverflow.com/questions/901115
**/
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

drawgraphs();
