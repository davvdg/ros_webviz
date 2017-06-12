var Graph = function(svg, nodes, edges, topics) {
	var self = this;
	self.nodes = nodes || [];
	self.topics = topics || [];
	self.edges = edges || [];
	self.svg = svg;

	self.boxes = [];
	self.fedges = [];
	var width = 600;
	var height = 600;

	var color = d3.scaleOrdinal(d3.schemeCategory20);



	self.simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.label; }))
    .force("charge", d3.forceManyBody().strength(-
    	1000).distanceMax(50000).distanceMin(0))
    .force("center", d3.forceCenter(width / 2, height / 2));

	self.svgnodes = self.svg.append("g")
		.attr("class", "nodes")
	
	self.svgtopics = self.svg.append("g")
		.attr("class", "topics")	

	self.svglink = self.svg.append("g")
    	.attr("class", "links")	

    self.setNodes([]);
    self.setTopics([]);
	self.setEdges([]);
	
	self.svg
		.attr("x", 0)
		.attr("y", 0)
		.attr("fx", 0)
		.attr("fy", 0);		


	self.svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 10)
    .attr("refY", 5)
    .attr("markerWidth", 13)
    .attr("markerHeight", 13)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,0 L0,10 L10,5 L0,0")

	self.updateBoxes()
      .on("tick", ticked);


  function ticked() {

  	var svgnodes = self.svgnodes
					.selectAll("g");
  	var svgtopics = self.svgtopics
					.selectAll("g");					
	var svglink = self.svglink
					.selectAll("line");					
				
  	function computexy(d) {
  		dx = d.target.x - d.source.x;
  		dy = d.target.y - d.source.y;
  		l = Math.sqrt(dx*dx + dy*dy);
  		dxN = 0;
  		dyN = 0;
  		if (l !== 0) {
	  		dxN = dx / l;
  			dyN = dy / l;
  		}
  		
  		return {x: dxN, y: dyN};
  	}

  	function arrowCoord(d, attr) {

  		c = computexy(d);
  		r = 25;
  		if (d[attr].r) {
  			r = d[attr].r;
  		}
  		if (d[attr].width) {
  			r = d[attr].width;
  		}
  		if (attr === "target") {
  			r = -r;
  		}
  		return {x: d[attr].x + c.x * r, y: d[attr].y + c.y * r};
  	}
    svglink
        .attr("x1", function(d) {return arrowCoord(d, "source").x; })
        .attr("y1", function(d) {return arrowCoord(d, "source").y; })
        .attr("x2", function(d) {return arrowCoord(d, "target").x; })
        .attr("y2", function(d) {return arrowCoord(d, "target").y; });

    svgnodes
		.attr("transform", function(d) {return "translate(" + d.x + "," + d.y+ ")"});

    svgtopics
		.attr("transform", function(d) {return "translate(" + (d.x) + "," + (d.y) + ")"});
  }
}

Graph.prototype.dragstarted = function(d) {
  var self = this;
  if (!d3.event.active) self.simulation.alphaTarget(0.1).restart();
  d.fx = d.x;
  d.fy = d.y;
}

Graph.prototype.dragstarted = function(d) {
  var self = this;
  if (!d3.event.active) self.simulation.alphaTarget(0.1).restart();
  d.fx = d.x;
  d.fy = d.y;
}

Graph.prototype.dragged = function(d) {
  var self = this;
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

Graph.prototype.dragended = function(d) {
  var self = this;
  if (!d3.event.active) self.simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


Graph.prototype.updateBoxes = function() {
	var self = this;
	self.boxes = [].concat(self.nodes, self.topics);
	
	console.log(self.boxes);
	return self.simulation.nodes(self.boxes)
}

Graph.prototype.setNodes = function(nodes) {
	var self = this;
	self.nodes = nodes
	.filter(	function(topic) {
		return (topic.label !== "/rosout" || topic.label !== "/clock");
	});

	var vgNodes = self.svgnodes
					.selectAll("g")
					.data(self.nodes);

	vgNodesG = vgNodes.enter().append("g")
	vgNodesG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );


	vgNodesG
		.append("circle")
		.attr("r", 25)


    vgNodesG
        .append("text")
		.text(function(d) { return d.label; });

    self.updateBoxes();
    self.updateEdges();
}

Graph.prototype.setTopics = function(topics) {
	var self = this;

	self.topics = topics.filter(	function(topic) {
		return (topic.label !== "/rosout" && topic.label !== "/clock");
	});

	var vgTopics = self.svgtopics
					.selectAll("g")
					.data(self.topics)
	
	var vgTopicsG = vgTopics.enter().append("g");
	vgTopicsG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );	
    vgTopicsG
    	.append("rect")
		.attr("width", 50)
		.attr("height", 50)
		.attr("x", -25)
		.attr("y", -25)


	vgTopicsG.append("text")
      .text(function(d) { return d.label; });

    self.updateBoxes();
    self.updateEdges();
}

Graph.prototype.updateEdges = function() {
	var self = this;
	self.fedges = self.edges;
	self.fedges = self.fedges.filter(
		function(item) {
			var s = item.source;			
			source = self.boxes.find(
				function(elem) {
					//console.log(elem.label);
					return elem.label === s;
				}
			);
			var t = item.target;
			target = self.boxes.find(
				function(elem) {					
					return elem.label === t;
				}
			);
			if (source !== undefined && target!== undefined) {
				return true
			}
			return false;
		}
	);

	self.svglink
    	.selectAll("line")
    	.data(self.fedges)
    	.enter().append("line")
        .attr("stroke-width", 2);
         		
    self.simulation.force("link")
      .links(self.fedges);

}

Graph.prototype.setEdges = function(edges) {
	var self = this;
	self.edges = edges;
	self.updateEdges();
}

document.onload = (function() {
	"use strict";
	console.log("haha");
	console.log(d3)
    var svg = d3.select("div#chart")
        .append("svg")
        .attr("width", "1024")
        .attr("height", "1024");
    console.log(svg);



    var graph = new Graph(svg);

	$.getJSON('./api/getnodes', function(data) {         
        graph.setNodes(data);
    });

	$.getJSON('./api/gettopics', function(data) {         
        graph.setTopics(data);
    });
	
	$.getJSON('./api/getntedges', function(data) {         
        graph.setEdges(data);
    });    
    

})(d3);