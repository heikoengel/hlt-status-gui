/**
 *
 * HLT Status UI
 *
 **/ 

// auto-update every 2s
var inter = setInterval(function() {
  drawgraphs();
}, 2000);


/** handle clicks on navigation tabs **/
function onClickTab(tab) {
    if (d3.select("#tab_"+tab).classed("active")) { return; }
    // hide all tab_content
    d3.selectAll(".tab_content").style("display", "none");
    // show selected tab_content
    d3.select("#div_"+tab).style("display", "unset");
    // mark tab as selected
    d3.selectAll(".tab").classed("active", false);
    d3.select("#tab_"+tab).classed("active", true);
}


/** handle clicks on Freeze/Resume button **/
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