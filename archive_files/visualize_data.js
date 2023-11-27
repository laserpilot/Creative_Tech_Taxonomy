import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// let data;

// fetch('./processed_data.json')
// .then(response => response.json())
// .then(data => console.log(data))
// .catch(error => console.log(error));


const data = {
  "name": "AI/Machine Learning",
  "children": [{
      "name": "Content Identification",
      "children": [{
          "name": "Object Recognition",
          "children": [{
              "name": "Body part tracking",
              "children": [{
                  "name": "Body Pose Tracking",
                  "children": [{
                      "name": "PoseNET",
                      "name": "TEST"
                  }]
              }]
          }]
      }]
  }]
};

// Specify the chart’s dimensions.
const width = 928;
const height = width;
const cx = width * 0.5; // adjust as needed to fit
const cy = height * 0.59; // adjust as needed to fit
const radius = Math.min(width, height) / 2 - 30;

// Create a radial tree layout. The layout’s first dimension (x)
// is the angle, while the second (y) is the radius.
const tree = d3.tree()
  .size([2 * Math.PI, radius])
  .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

// Sort the tree and apply the layout.
const root = tree(d3.hierarchy(data)
  .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

// Creates the SVG container.
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [-cx, -cy, width, height])
  .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

// Append links.
svg.append("g")
  .attr("fill", "none")
  .attr("stroke", "#555")
  .attr("stroke-opacity", 0.4)
  .attr("stroke-width", 1.5)
.selectAll()
.data(root.links())
.join("path")
  .attr("d", d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y));

// Append nodes.
svg.append("g")
.selectAll()
.data(root.descendants())
.join("circle")
  .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
  .attr("fill", d => d.children ? "#555" : "#999")
  .attr("r", 2.5);

// Append labels.
svg.append("g")
  .attr("stroke-linejoin", "round")
  .attr("stroke-width", 3)
.selectAll()
.data(root.descendants())
.join("text")
  .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
  .attr("dy", "0.31em")
  .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
  .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
  .attr("paint-order", "stroke")
  .attr("stroke", "white")
  .attr("fill", "currentColor")
  .text(d => d.data.name);

  container.append(svg.node());