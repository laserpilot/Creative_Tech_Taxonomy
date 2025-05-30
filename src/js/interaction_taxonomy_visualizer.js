// Interaction taxonomy visualization using D3
import * as d3 from "d3"
import { loadDefaultJapaneseParser } from "budoux"
import { getColor, defaultColor, defaultBackgroundColor } from "./color_setting.js"
import { showModal, showEditModal, showAddChildModal } from "./modal.js"

// use budoux to parse japanese text
const textParser = loadDefaultJapaneseParser()

let currentLanguage = "en"
let currentInteractionJson = null
let linebreakThreshold = 20
let editMode = false

// Get window width and height
let windowWidth = window.visualViewport.width
let windowHeight = window.visualViewport.height

// Check if the screen is mobile
let isMobile = windowWidth < 768

// Load interaction taxonomy data
fetch("./Interaction_taxonomy_enhanced.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    return response.json()
  })
  .then((data) => {
    currentInteractionJson = data
    createInteractionVisualization()
  })
  .catch((error) => {
    console.error("Error loading interaction taxonomy:", error)
  })

// Function to update JSON content based on language preference
function updateInteractionJsonFromLanguage(data) {
  // Deep copy the data to avoid modifying the original
  const updatedData = JSON.parse(JSON.stringify(data))

  function processNode(node) {
    // Handle name
    if (node.name && typeof node.name === 'object') {
      node.name = node.name[currentLanguage] || node.name.en || "No Name"
    }

    // Handle description
    if (node.description && typeof node.description === 'object') {
      node.description = node.description[currentLanguage] || node.description.en || ""
    }

    // Add color if not present
    if (!node.color) {
      node.color = getColor(node.name) || defaultColor
    }

    // Add background color
    node.backgroundColor = defaultBackgroundColor

    // Process text with line breaks
    if (node.name && node.name.length > linebreakThreshold) {
      if (currentLanguage === "ja") {
        node.textWithLineBreaks = textParser.parse(node.name).join("")
      } else {
        node.textWithLineBreaks = node.name.replace(/(.{1,20})(\s+|$)/g, "$1\n").trim()
      }
    } else {
      node.textWithLineBreaks = node.name || ""
    }

    // Recursively process children
    if (node.children) {
      node.children.forEach(processNode)
    }

    return node
  }

  return processNode(updatedData)
}

export function createInteractionVisualization() {
  // Deep copy and then pass it on.
  const data = updateInteractionJsonFromLanguage(structuredClone(currentInteractionJson))
  
  // Clear any existing visualization
  const interactionVisualizer = document.getElementById("interaction-visualizer")
  interactionVisualizer.innerHTML = ""
  
  /* -------------------------------------------------------------------------- */
  /*                set all parameters according to screen width                */
  /* -------------------------------------------------------------------------- */
  let fontSize = 18
  let lineHeight = 1.2
  let circleRadius = 10
  let strokeWidth = 3

  // Definition of node spacing
  let dx = fontSize * 3
  let dy = fontSize * linebreakThreshold

  // Define the tree layout and the shape for links.
  // Make root globally accessible for saving/modifying the JSON
  window.interactionRoot = d3.hierarchy(data)
  window.interactionRoot.dx = dx
  window.interactionRoot.dy = dy
  const tree = d3.tree().nodeSize([window.interactionRoot.dx, window.interactionRoot.dy])

  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x)

  // Create the SVG container.
  const parentSvg = d3
    .create("svg")
    .attr("width", windowWidth)
    .attr("height", windowHeight)
    .attr("viewBox", [-50, -windowHeight / 2, windowWidth, windowHeight])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("font", `${fontSize}px Inter, system-ui, sans-serif`)

  const svg = parentSvg.append("g")

  // Add zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", (event) => {
      svg.attr("transform", event.transform)
    })

  parentSvg.call(zoom)

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", strokeWidth)

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all")

  // Update function for the visualization
  function update(event, source) {
    const duration = event?.altKey ? 2500 : 250
    const nodes = window.interactionRoot.descendants().reverse()
    const links = window.interactionRoot.links()

    // Compute the new tree layout.
    tree(window.interactionRoot)

    let left = window.interactionRoot
    let right = window.interactionRoot
    window.interactionRoot.eachBefore((node) => {
      if (node.x < left.x) left = node
      if (node.x > right.x) right = node
    })

    const height = right.x - left.x + window.interactionRoot.dx * 2

    const transition = svg
      .transition()
      .duration(duration)
      .attr("viewBox", [-window.interactionRoot.dy / 3, left.x - window.interactionRoot.dx, windowWidth, height])
      .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"))

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id)

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)

    // Add circles for nodes
    nodeEnter
      .append("circle")
      .attr("r", circleRadius)
      .attr("fill", (d) => (d._children ? d.data.color : "#fff"))
      .attr("stroke", (d) => d.data.color)
      .attr("stroke-width", strokeWidth)
      .on("click", (event, d) => {
        if (editMode) {
          if (d._children || d.children) {
            // Parent node in edit mode - show add child modal
            showAddChildModal(d)
          } else {
            // Leaf node - show add child modal (to add first child)
            showAddChildModal(d)
          }
        } else {
          // Normal behavior - toggle children
          if (event.shiftKey) {
            // Expand all child nodes
            if (d._children) {
              d.children = d._children
              d._children.forEach(handleExpand)
              update(event, d)
            }
            focusNode(d.parent)
          } else {
            // Toggle the children
            d.children = d.children ? null : d._children
            update(event, d)
            focusNode(d)
          }
        }
      })
      .on("mouseover", (event, d) => ((d._children || editMode) ? handlerChangeScale(event.target, 1.5) : null))
      .on("mouseout", (event, d) => ((d._children || editMode) ? handlerChangeScale(event.target, 1) : null))

    // Add text labels
    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d._children ? -6 : 6))
      .attr("y", (d) => (d._children ? -6 : 6))
      .attr("text-anchor", (d) => (d._children ? "end" : "start"))
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("stroke-width", 5)
      .attr("fill", d => d.data.color)
      .attr("font-weight", "bold")
      .text((d) => d.data.textWithLineBreaks)
      .on("click", (event, d) => {
        if (editMode) {
          // In edit mode, show edit modal for the node
          showEditModal(d)
        } else {
          // In normal mode, show info modal
          showModal(d)
        }
      })

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1)

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d) => d.target.id)

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 }
        return diagonal({ source: o, target: o })
      })
      .attr("stroke-width", strokeWidth)
      .attr("stroke", (d) => d3.color(d.source.data.color).copy({ opacity: 0.6 }))

    // Transition links to their new position.
    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", diagonal)
      .attr("stroke", (d) => d3.color(d.source.data.color).copy({ opacity: 0.6 }))

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y }
        return diagonal({ source: o, target: o })
      })

    // Stash the old positions for transition.
    window.interactionRoot.eachBefore((d) => {
      d.x0 = d.x
      d.y0 = d.y
    })
  }

  // Helper functions
  function handleExpand(d) {
    if (d._children) {
      d.children = d._children
      d._children = null
    }
  }

  function handleCollapse(d) {
    if (d.children) {
      d._children = d.children
      d.children = null
    }
  }

  function focusNode(node) {
    if (!node) return
    
    const scale = 1.5
    const x = -node.y * scale + windowWidth / 2
    const y = -node.x * scale + windowHeight / 2
    
    parentSvg
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale))
  }

  function handlerChangeScale(target, scale) {
    d3.select(target)
      .transition()
      .duration(200)
      .attr("transform", `scale(${scale})`)
  }

  // Initialize the tree
  window.interactionRoot.x0 = windowWidth / 2
  window.interactionRoot.y0 = windowHeight / 2
  window.interactionRoot.descendants().forEach((d, i) => {
    d.id = i
    d._children = d.children
  })

  // Close all nodes initially
  handleCollapse(window.interactionRoot)
  update(null, window.interactionRoot)

  // Append the svg to the interaction visualizer
  interactionVisualizer.append(parentSvg.node())

  // Focus on the root node
  focusNode(window.interactionRoot)

  setTimeout(() => {
    // Collapse after the second level
    window.interactionRoot.children = window.interactionRoot._children
    update(null, window.interactionRoot)
  }, 1000)
}

// Function to update language for interaction taxonomy
export const updateInteractionLanguage = (language) => {
  currentLanguage = language
  refreshInteractionVisualize()
}

// Function to update edit mode for interaction taxonomy
export const updateInteractionEditMode = (mode) => {
  editMode = mode
  refreshInteractionVisualize()
}

// Refresh the interaction visualization
export const refreshInteractionVisualize = () => {
  createInteractionVisualization()
}