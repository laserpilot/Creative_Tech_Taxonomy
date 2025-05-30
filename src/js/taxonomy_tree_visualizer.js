// app that creates a collapsible tree visualization using D3
import * as d3 from "d3"
import JSONEditor from "jsoneditor"
import "jsoneditor/dist/jsoneditor.min.css"
import { loadDefaultJapaneseParser } from "budoux"
import { downloadJSON } from "./handle_interactions_panel.js"
import { getColor, defaultColor, defaultBackgroundColor } from "./color_setting.js"
import { showModal, showEditModal, showAddChildModal } from "./modal.js"

// use budoux to parse japanese text
const textParser = loadDefaultJapaneseParser()

let currentLanguage = "en"
let currentJson = null
let linebreakThreshold = 20
let editMode = false

// Get window width and height
// TODO: resize event
let windowWidth = window.visualViewport.width
let windowHeight = window.visualViewport.height

// Check if the screen is mobile
let isMobile = windowWidth < 768

// json loader
fetch("./Creative_Tech_Taxonomy_data.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    return response.json()
  })
  .then((data) => {
    currentJson = data
    createEditor()
    createVisualization()
  })
  .catch((error) => console.error(error))

// Change from the original JSON to make it easier to use for display
const updateJsonFromLanguage = (json) => {
  // Switching between languages, etc., can also be complicated when switching by display.

  const filterVisibleInfo = (node, color) => {
    // if color is not default color, use it
    if (color !== defaultColor) {
      node.color = color
    } else if (node.name["en"]) {
      node.color = getColor(node.name["en"])
    }

    // First check if the current language is available
    if (node.name[currentLanguage]) {
      // If yes, use it
      node.name = node.name[currentLanguage]
    } else {
      // If not, check if English is available
      node.name = node.name["en"] ? node.name["en"] : "No Name Available"
    }

    // check for linebreak
    if (countUpText(node.name) > linebreakThreshold && node.children) {
      node.label = splitText(node.name)
    } else {
      node.label = [node.name]
    }

    // Description is always in english yet
    // Implement it for the next step
    if (node.description[currentLanguage]) {
      node.description = node.description[currentLanguage]
    } else if (node.description["en"]) {
      node.description = node.description["en"]
    } else {
      node.description = node.description ? node.description : "No description available yet. Please add one!"
    }

    // If there are children, recursion is performed.
    if (node.children) {
      for (let index = 0; index < node.children.length; index++) {
        filterVisibleInfo(node.children[index], node.color)
      }
    }
    return node
  }

  json = filterVisibleInfo(json, defaultColor)
  return json
}

/* -------------------------------------------------------------------------- */
/*                              d3 visualization                              */
/* -------------------------------------------------------------------------- */
export function createVisualization() {
  // Deep copy and then pass it on.
  const data = updateJsonFromLanguage(structuredClone(currentJson))
  /* -------------------------------------------------------------------------- */
  /*                set all parameters according to screen width                */
  /* -------------------------------------------------------------------------- */
  // Specify the charts’ dimensions. The height is variable, depending on the layout.

  let fontSize = 18
  let lineHeight = 1.2
  let circleRadius = 10
  let strokeWidth = 3

  // Definition of node spacing
  let dx = fontSize * 3
  let dy = fontSize * linebreakThreshold

  // Define the tree layout and the shape for links.
  // Make root globally accessible for saving/modifying the JSON
  window.root = d3.hierarchy(data)
  window.root.dx = dx
  window.root.dy = dy
  const tree = d3.tree().nodeSize([window.root.dx, window.root.dy])

  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x)

  // Create the SVG container, a layer for the links and a layer for the nodes.
  // Set the viewBox width to the screen width
  const parentSvg = d3.create("svg").attr("id", "tree").attr("viewBox", [0, 0, windowWidth, windowHeight])

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
  const focusNode = (node) => {
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
  function update(event, source) {
    const nodes = window.root.descendants().reverse()
    const links = window.root.links()
    // Compute the new tree layout.
    tree(window.root)

    const transition = svg
      .transition()
      .attr("viewBox", [0, 0, windowWidth, windowHeight])
      .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"))

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id)

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g").attr("fill-opacity", 0).attr("stroke-opacity", 0)

    // generate text node
    nodeEnter
      .append("text")
      .attr("cursor", "help")
      .attr("x", (d) => (d._children ? -fontSize : fontSize))
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", (d) => (d._children ? "end" : "start"))
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

    // add warping box around text node
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
        event.stopPropagation()
        
        if (editMode) {
          // In edit mode
          if (event.shiftKey) {
            // Expand all child nodes with Shift key (same as normal mode)
            if (d._children) {
              d.children = d._children
              d._children.forEach(handleExpand)
              update(event, d)
            }
            focusNode(d.parent)
          } else if (d._children || d.children) {
            // If node has children (collapsed or expanded), toggle them
            d.children = d.children ? null : d._children
            update(event, d)
            focusNode(d)
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
          import("./modal.js").then(modal => {
            modal.showAddChildModal(d)
          })
        }
      })
      .on("mouseover", (event) => editMode ? handlerChangeScale(event.target, 1.5) : null)
      .on("mouseout", (event) => editMode ? handlerChangeScale(event.target, 1) : null)

    // shadow effect node
    nodeEnter
      .select("text")
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", (d) => d3.color(d.data.color).copy({ opacity: 0.1 }))

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1)
    
    // Update plus icons for edit mode changes
    node.merge(nodeEnter)
      .select(".add-child-icon")
      .attr("pointer-events", (d) => editMode ? "all" : "none")
      .attr("opacity", (d) => editMode ? 1 : 0)

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
    root.eachBefore((d) => {
      d.x0 = d.x
      d.y0 = d.y
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                               initialize tree                              */
  /* -------------------------------------------------------------------------- */
  // Do the first update to the initial configuration of the tree — where a number of nodes
  // are open
  window.root.x0 = windowWidth / 2
  window.root.y0 = windowHeight / 2
  window.root.descendants().forEach((d, i) => {
    d.id = i
    d._children = d.children
  })

  // close all nodes
  handleCollapse(window.root)
  update(null, window.root)

  // Append the svg object to container
  visualizer.append(parentSvg.node())

  // focus on the root node
  focusNode(window.root)

  setTimeout(() => {
    // Collapse after the second level
    window.root.children = window.root._children
    update(null, window.root)
  }, 1000)

  /* -------------------------------------------------------------------------- */
  /*                              handler functions                             */
  /* -------------------------------------------------------------------------- */

  // Helper function to detect active tab and get appropriate taxonomy
  function getActiveTaxonomy() {
    const elements = document.getElementsByName("tab")
    for (let i = 0; i < elements.length; i++) {
      if (elements.item(i).checked) {
        if (elements.item(i).value === "interaction") {
          return {
            root: window.interactionRoot,
            isInteraction: true
          }
        }
      }
    }
    return {
      root: window.root,
      isInteraction: false
    }
  }

  document.getElementById("reset").addEventListener("click", () => {
    const { root, isInteraction } = getActiveTaxonomy()
    if (isInteraction && window.interactionRoot) {
      // Import and use interaction taxonomy's focusNode
      import("./interaction_taxonomy_visualizer.js").then(module => {
        // The focusNode function is internal, so we'll trigger a refresh instead
        module.refreshInteractionVisualize()
      })
    } else {
      focusNode(root)
    }
  })

  document.getElementById("allExpand").addEventListener("click", () => {
    const { root, isInteraction } = getActiveTaxonomy()
    if (isInteraction && window.interactionRoot) {
      // Import interaction taxonomy functions
      import("./interaction_taxonomy_visualizer.js").then(module => {
        // We need to access the internal functions, so let's trigger a manual expand
        function expandAll(d) {
          if (d._children) {
            d.children = d._children
          }
          var children = d.children ? d.children : d._children
          if (children) children.forEach(expandAll)
        }
        expandAll(window.interactionRoot)
        module.refreshInteractionVisualize()
      })
    } else {
      handleExpand(root)
      update(null, root)
      focusNode(root)
    }
  })

  document.getElementById("allCollapse").addEventListener("click", () => {
    const { root, isInteraction } = getActiveTaxonomy()
    if (isInteraction && window.interactionRoot) {
      // Import interaction taxonomy functions
      import("./interaction_taxonomy_visualizer.js").then(module => {
        // Reset and collapse interaction taxonomy
        window.interactionRoot.x0 = dy / 2
        window.interactionRoot.y0 = 0
        window.interactionRoot.descendants().forEach((d, i) => {
          d.id = i
          d._children = d.children
        })
        function collapseAll(d) {
          if (d.children) {
            d._children = d.children
            d._children.forEach(collapseAll)
            d.children = null
          }
        }
        if (window.interactionRoot.children) {
          window.interactionRoot.children.forEach(collapseAll)
        }
        module.refreshInteractionVisualize()
      })
    } else {
      root.x0 = dy / 2
      root.y0 = 0
      root.descendants().forEach((d, i) => {
        d.id = i
        d._children = d.children
      })
      root.children.forEach(handleCollapse)
      update(null, root)
      focusNode(root)
    }
  })
}

// DONE: make fold don't fold first layer
const handleCollapse = (d) => {
  if (d.children) {
    d._children = d.children
    d._children.forEach(handleCollapse)
    d.children = null
  }
}

// DONE: fix expand node look
const handleExpand = (d) => {
  if (d._children) {
    d.children = d._children
  }
  var children = d.children ? d.children : d._children
  if (children) children.forEach(handleExpand)
}

// handle language change
document.getElementById("languageSelect").addEventListener("change", function () {
  const selectedLanguage = document.getElementById("languageSelect").value
  currentLanguage = selectedLanguage
  console.log(`Language changed to ${currentLanguage}`)
  refreshVisualize()
  
  // Also update interaction taxonomy language
  import("./interaction_taxonomy_visualizer.js").then(module => {
    module.updateInteractionLanguage(selectedLanguage)
  })
})

// handle edit mode toggle
document.getElementById("toggleEditMode").addEventListener("click", function() {
  editMode = !editMode
  const button = document.getElementById("toggleEditMode")
  const instructions = document.getElementById("edit-mode-instructions")
  const saveEditsContainer = document.getElementById("save-edits-container")
  
  if (editMode) {
    button.classList.add("active")
    instructions.style.display = "block"
    saveEditsContainer.style.display = "block"
    console.log("Edit mode enabled")
  } else {
    button.classList.remove("active")
    instructions.style.display = "none"
    saveEditsContainer.style.display = "none"
    console.log("Edit mode disabled")
  }
  refreshVisualize()
  
  // Also update interaction taxonomy edit mode
  import("./interaction_taxonomy_visualizer.js").then(module => {
    module.updateInteractionEditMode(editMode)
  })
})

// handle save edits button
document.getElementById("saveEdits").addEventListener("click", function() {
  // Ensure currentJson is updated with the latest tree data
  updateCurrentJson()
  
  // Get the complete JSON structure
  const exportJson = structuredClone(currentJson)
  
  // Create a file name with date stamp
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
  const filename = `Creative_Tech_Taxonomy_data_${dateStr}.json`
  
  // Convert to pretty JSON string
  const jsonStr = JSON.stringify(exportJson, null, 2)
  
  // Create a download link
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  
  // Show feedback notification
  const notification = document.createElement('div')
  notification.className = 'notification'
  notification.textContent = 'JSON file saved with all changes!'
  document.body.appendChild(notification)
  
  // Auto remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out')
    setTimeout(() => notification.remove(), 500)
  }, 3000)
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
})

// Refresh the visualization
export const refreshVisualize = () => {
  visualizer.innerHTML = ""
  createVisualization()
}

// Refresh with hierarchy sync - for cases where we want to sync d3 hierarchy changes back to JSON first
export const refreshVisualizeWithSync = () => {
  updateCurrentJson()
  visualizer.innerHTML = ""
  createVisualization()
}

// Update the currentJson from the root hierarchy
// Get the current JSON data
export const getCurrentJson = () => {
  return currentJson
}

export const updateCurrentJson = () => {
  if (window.root) {
    // We need to convert the d3 hierarchy back to plain JSON
    function restoreOriginalFormat(node) {
      // Create a new node object with proper multilingual structure
      const jsonNode = {}
      
      // Handle name - restore multilingual format
      if (typeof node.data.name === 'string') {
        // If it was converted to a string, restore object format
        jsonNode.name = {
          en: node.data.name
        }
      } else if (typeof node.data.name === 'object') {
        // Original multilingual format is preserved
        jsonNode.name = node.data.name
      }
      
      // Handle description - restore multilingual format
      if (typeof node.data.description === 'string') {
        // If it was converted to a string, restore object format
        jsonNode.description = {
          en: node.data.description
        }
      } else if (typeof node.data.description === 'object') {
        // Original multilingual format is preserved
        jsonNode.description = node.data.description
      }
      
      // Copy other properties
      jsonNode.tags = node.data.tags || []
      jsonNode.links = node.data.links || {}
      
      // Handle children recursively
      if (node.children || node._children) {
        jsonNode.children = []
        
        // Process visible children
        if (node.children) {
          node.children.forEach(child => {
            jsonNode.children.push(restoreOriginalFormat(child))
          })
        }
        
        // Process collapsed children
        if (node._children && !node.children) {
          node._children.forEach(child => {
            jsonNode.children.push(restoreOriginalFormat(child))
          })
        }
      }
      
      return jsonNode
    }
    
    // Convert the hierarchy back to original JSON format
    currentJson = restoreOriginalFormat(window.root)
    console.log("Updated currentJson with properly formatted data")
    console.log("Current JSON after update:", currentJson)
  }
}

/* -------------------------------------------------------------------------- */
/*                             json editor related                            */
/* -------------------------------------------------------------------------- */
// create json editor
const createEditor = () => {
  const data = currentJson

  let changedBounceTimer = null
  // editor options
  const options = {
    onChange: () => {
      // debounce the refresh
      if (changedBounceTimer) clearTimeout(changedBounceTimer)

      console.log("json changed and set refresh timer")

      currentJson = jsonEdit.get()
      changedBounceTimer = setTimeout(refreshVisualize, 1000)
    }
  }

  // add the editor to the page
  const jsonEdit = new JSONEditor(editor, options)
  jsonEdit.set(data)
  document.getElementById("downloadJson").addEventListener("click", () => {
    downloadJSON(jsonEdit)
  })
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
