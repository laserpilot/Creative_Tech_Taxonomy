// app that creates a collapsible tree visualization using D3
import * as d3 from "d3"
import JSONEditor from "jsoneditor"
import "jsoneditor/dist/jsoneditor.min.css"
import { loadDefaultJapaneseParser } from "budoux"
import { downloadJSON } from "./handle_interactions_panel.js"
import { getColor, defaultColor, defaultBackgroundColor } from "./color_setting.js"
import { showModal } from "./modal.js"

// use budoux to parse japanese text
const textParser = loadDefaultJapaneseParser()

let currentLanguage = "en"
let currentJson = null
let linebreakThreshold = 20

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
  const root = d3.hierarchy(data)
  root.dx = dx
  root.dy = dy
  const tree = d3.tree().nodeSize([root.dx, root.dy])

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
    const nodes = root.descendants().reverse()
    const links = root.links()
    // Compute the new tree layout.
    tree(root)

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
      })
      .attr("y", function (d) {
        if (d.data.label.length === 1) {
          return 0
        } else {
          return -(this.getBBox().height / 4)
        }
      })
      .on("click", (event, d) => {
        showModal(d)
        event.stopPropagation()
      })

    // add warping box around text node
    let rectPadding = 10
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
      .attr("fill", (d) => d.data.color)
      .attr("opacity", (d) => (d._children ? 0 : 0.5))
      .lower()

    nodeEnter
      .append("circle")
      .attr("cursor", (d) => (d._children ? "pointer" : "default"))
      .attr("r", (d) => (d._children ? circleRadius : circleRadius / 1.4))
      .attr("fill", (d) => (d._children ? d.data.color : defaultBackgroundColor))
      .attr("stroke", (d) => d.data.color)
      .attr("stroke-width", strokeWidth)
      .on("click", (event, d) => {
        event.stopPropagation()
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
      })
      .on("mouseover", (event, d) => (d._children ? handlerChangeScale(event.target, 1.5) : null))
      .on("mouseout", (event, d) => (d._children ? handlerChangeScale(event.target, 1) : null))

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
  root.x0 = windowWidth / 2
  root.y0 = windowHeight / 2
  root.descendants().forEach((d, i) => {
    d.id = i
    d._children = d.children
  })

  // close all nodes
  handleCollapse(root)
  update(null, root)

  // Append the svg object to container
  visualizer.append(parentSvg.node())

  // focus on the root node
  focusNode(root)

  setTimeout(() => {
    // Collapse after the second level
    root.children = root._children
    update(null, root)
  }, 1000)

  /* -------------------------------------------------------------------------- */
  /*                              handler functions                             */
  /* -------------------------------------------------------------------------- */

  document.getElementById("reset").addEventListener("click", () => {
    focusNode(root)
  })

  document.getElementById("allExpand").addEventListener("click", () => {
    handleExpand(root)
    update(null, root)
    focusNode(root)
  })

  document.getElementById("allCollapse").addEventListener("click", () => {
    root.x0 = dy / 2
    root.y0 = 0
    root.descendants().forEach((d, i) => {
      d.id = i
      d._children = d.children
    })
    root.children.forEach(handleCollapse)
    update(null, root)
    focusNode(root)
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
})

// Refresh the visualization
const refreshVisualize = () => {
  visualizer.innerHTML = ""
  createVisualization()
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
