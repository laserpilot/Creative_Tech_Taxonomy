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

  function processNode(node, parentColor = null) {
    // Handle name
    if (node.name && typeof node.name === 'object') {
      node.name = node.name[currentLanguage] || node.name.en || "No Name"
    }

    // Handle description
    if (node.description && typeof node.description === 'object') {
      node.description = node.description[currentLanguage] || node.description.en || ""
    }

    // Add color with proper inheritance logic (matching main taxonomy)
    if (node.name) {
      // First, try to get color by name
      node.color = getColor(node.name) || defaultColor
    } else {
      node.color = defaultColor
    }
    
    // Only inherit parent color if this node doesn't have its own defined color
    if (node.color === defaultColor && parentColor && parentColor !== defaultColor) {
      node.color = parentColor
    }

    // Add background color
    node.backgroundColor = defaultBackgroundColor

    // Process text with line breaks (matching main taxonomy)
    if (countUpText(node.name) > linebreakThreshold && node.children) {
      node.label = splitText(node.name)
    } else {
      node.label = [node.name]
    }

    // Recursively process children with color inheritance
    if (node.children) {
      node.children.forEach(child => processNode(child, node.color))
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

  // Create the SVG container, a layer for the links and a layer for the nodes.
  // Set the viewBox width to the screen width (matching main taxonomy)
  const parentSvg = d3.create("svg").attr("id", "interaction-tree").attr("viewBox", [0, 0, windowWidth, windowHeight])

  const svg = parentSvg.append("g").attr("pointer-events", "all")

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", strokeWidth)

  // Prepare a g node to retrieve all events
  const gNode = svg.append("g").attr("cursor", "pointer")

  /* -------------------------------------------------------------------------- */
  /*                                d3 functions                                */
  /* -------------------------------------------------------------------------- */
  // helper function to zoom event
  const zoomEvent = ({ transform }) => {
    if (transform != null) svg.attr("transform", transform)
  }

  // Set zoom listener to svg
  const zoomListener = d3
    .zoom()
    // .extent([[0, 0], [windowWidth, windowHeight]])
    .scaleExtent([0.3, 3])
    .on("zoom", zoomEvent)
  // and disable double click zoom
  parentSvg.call(zoomListener).on("dblclick.zoom", null)

  // Set default zoom
  let defaultZoom = 0.8
  if (isMobile) defaultZoom = 0.6
  parentSvg.call(zoomListener.transform, d3.zoomIdentity.scale(defaultZoom))

  /* -------------------------------------------------------------------------- */
  /*                          draw each node and update                         */
  /* -------------------------------------------------------------------------- */
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
      .attr("viewBox", [0, 0, windowWidth, windowHeight])
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

    // generate text node (matching main taxonomy)
    nodeEnter
      .append("text")
      .attr("cursor", "help")
      .attr("x", (d) => (d._children ? -fontSize : fontSize))
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", (d) => (d._children ? "end" : "start"))
      .attr("fill", "black") // All text black as requested
      .each(function (d) {
        d.data.label.forEach((line, index) => {
          d3.select(this)
            .append("tspan")
            .attr("dy", index > 0 ? `${convertRemToPx(index * lineHeight)}px` : 0)
            .attr("x", d._children ? -fontSize : fontSize)
            .text(line)
        })
        
        // Add edit icon if in edit mode
        if (editMode) {
          d3.select(this)
            .append("tspan")
            .attr("dy", 0)
            .attr("x", (d.data.label.length > 1 ? 
                  d._children ? -fontSize : fontSize : 
                  d._children ? -fontSize - 20 : fontSize + d3.select(this).node().getBBox().width + 5))
            .attr("fill", "#2196f3")
            .text(" ✎")
        }
      })
      .attr("y", function (d) {
        if (d.data.label.length === 1) {
          return 0
        } else {
          return -(this.getBBox().height / 4)
        }
      })
      .on("click", (event, d) => {
        if (editMode) {
          showEditModal(d)
        } else {
          showModal(d)
        }
        event.stopPropagation()
      })

    // add warping box around text node (matching main taxonomy exactly)
    let rectPadding = 20
    nodeEnter
      .append("rect")
      .attr("cursor", "help")
      .attr("rx", fontSize) // Adjust the x-radius for rounded corners
      .attr("ry", fontSize) // Adjust the y-radius for rounded corners
      .attr("height", function (d) {
        return d3.select(this.parentNode).select("text").node().getBBox().height + rectPadding
      })
      .attr("width", function (d) {
        return d3.select(this.parentNode).select("text").node().getBBox().width + fontSize + fontSize + rectPadding
      })
      .attr("x", -(fontSize / 2)) // Center the rect around the text
      .attr("y", function (d) {
        return -(d3.select(this.parentNode).select("text").node().getBBox().height + rectPadding) / 2
      })
      .attr("fill", (d) => editMode ? "#2196f3" : d.data.color)
      .attr("opacity", (d) => (d._children ? 0 : 0.5))
      .attr("stroke", (d) => editMode ? "#0b7dda" : "none")
      .attr("stroke-width", (d) => editMode ? 1 : 0)
      .attr("stroke-dasharray", (d) => editMode ? "3,3" : "none")
      .lower()

    // Add circles for nodes
    nodeEnter
      .append("circle")
      .attr("cursor", (d) => ((d._children || editMode) ? "pointer" : "default"))
      .attr("r", (d) => (d._children ? circleRadius : circleRadius / 1.4))
      .attr("fill", (d) => {
        if (editMode) return "rgba(255, 100, 100, 0.5)"
        return (d._children ? d.data.color : defaultBackgroundColor)
      })
      .attr("stroke", (d) => editMode ? "rgba(255, 50, 50, 0.8)" : d.data.color)
      .attr("stroke-width", strokeWidth)
      .on("click", (event, d) => {
        if (editMode) {
          if (d._children || d.children) {
            // Parent node has children - toggle them or show add child modal
            if (d._children) {
              // Node is collapsed, expand it
              d.children = d._children
              d._children = null
              update(event, d)
              focusNode(d)
            } else {
              // Node is expanded, show add child modal  
              showAddChildModal(d)
            }
          } else {
            // Node has no children, show add child modal
            showAddChildModal(d)
          }
        } else {
          // Normal behavior
          // Check if the 'Shift' key is pressed
          if (event.shiftKey) {
            // Expand all child nodes
            if (d._children) {
              d.children = d._children // Set children to _children
              d._children.forEach(handleExpand)
              update(event, d)
            }
            focusNode(d.parent)
          } else {
            // Toggle the children and toggle filled/hollow on click
            d.children = d.children ? null : d._children
            update(event, d)
            focusNode(d)
          }
        }
      })
      .on("mouseover", (event, d) => ((d._children || editMode) ? handlerChangeScale(event.target, 1.5) : null))
      .on("mouseout", (event, d) => ((d._children || editMode) ? handlerChangeScale(event.target, 1) : null))
      
    // Add plus sign to circles in edit mode
    nodeEnter
      .append("text")
      .attr("class", "add-child-icon")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", fontSize)
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("pointer-events", (d) => editMode ? "all" : "none") // Only clickable in edit mode
      .attr("cursor", "pointer")
      .attr("opacity", (d) => editMode ? 1 : 0)
      .text("+")
      .on("click", (event, d) => {
        if (editMode) {
          // Show add child modal
          event.stopPropagation()
          showAddChildModal(d)
        }
      })
      .on("mouseover", (event) => editMode ? handlerChangeScale(event.target, 1.5) : null)
      .on("mouseout", (event) => editMode ? handlerChangeScale(event.target, 1) : null)


    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1)
    
    // Update plus icons and edit mode styling for existing nodes
    node.merge(nodeEnter)
      .select(".add-child-icon")
      .attr("pointer-events", (d) => editMode ? "all" : "none")
      .attr("opacity", (d) => editMode ? 1 : 0)
    
    // Update circle styling for edit mode
    node.merge(nodeEnter)
      .select("circle")
      .attr("stroke", (d) => editMode ? "rgba(255, 50, 50, 0.8)" : d.data.color)
      .attr("fill", (d) => {
        if (editMode) return "rgba(255, 100, 100, 0.5)"
        return (d._children ? d.data.color : defaultBackgroundColor)
      })
    
    // Update rect styling for edit mode
    node.merge(nodeEnter)
      .select("rect")
      .attr("stroke", (d) => editMode ? "#0b7dda" : d.data.color)
      .attr("fill", (d) => editMode ? "#2196f3" : d.data.color)
      .attr("stroke-width", (d) => editMode ? 1 : 3)
      .attr("stroke-dasharray", (d) => editMode ? "3,3" : "0")

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


  // Helper functions (matching main taxonomy exactly)
  const handleCollapse = (d) => {
    if (d.children) {
      d._children = d.children
      d._children.forEach(handleCollapse)
      d.children = null
    }
  }

  const handleExpand = (d) => {
    if (d._children) {
      d.children = d._children
    }
    var children = d.children ? d.children : d._children
    if (children) children.forEach(handleExpand)
  }

  const focusNode = (node) => {
    if (!node) return
    
    let t = d3.zoomTransform(svg.node())
    let x = -node.y0
    let y = -node.x0
    if (isMobile) {
      // Mobile
      x = x * t.k + windowWidth / 4
    } else {
      // PC
      x = x * t.k + windowWidth / 3
    }
    y = y * t.k + windowHeight / 2
    parentSvg
      .transition()
      .duration(500)
      .ease(d3.easeQuadInOut)
      .call(zoomListener.transform, d3.zoomIdentity.translate(x, y).scale(t.k))
  }

  // helper function to change scale
  const handlerChangeScale = (element, scaleSize) => {
    d3.select(element).attr("transform", `scale(${scaleSize})`).transition().ease(d3.easeElastic)
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

/* -------------------------------------------------------------------------- */
/*                             helper functions                               */
/* -------------------------------------------------------------------------- */
// helper function to count up text length
// japanese characters are counted as 2
// english characters are counted as 1
const countUpText = (text) => {
  let len = 0
  for (let i = 0; i < text.length; i++) {
    text[i].match(/[ -~]/) ? (len += 1) : (len += 2)
  }
  return len
}

// helper function to split text
const splitText = (text) => {
  const lines = []
  const splitWords = []
  const words = text.split(/\s+/)
  for (let w = 0; w < words.length; w++) {
    const word = textParser.parse(words[w])
    splitWords.push(...word)
  }
  let currentLine = splitWords[0]
  for (let i = 1; i < splitWords.length; i++) {
    const word = splitWords[i]
    if (countUpText(currentLine) + countUpText(word) <= linebreakThreshold) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

// bug for iPhone
// dy is not calculated correctly
// rem to px converter
const convertRemToPx = (rem) => {
  var fontSize = getComputedStyle(document.documentElement).fontSize
  return rem * parseFloat(fontSize)
}