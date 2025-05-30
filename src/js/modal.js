import * as d3 from "d3"
import { refreshVisualize, refreshVisualizeWithSync } from "./taxonomy_tree_visualizer.js"

/* -------------------------------------------------------------------------- */
/*                            show and close modal                            */
/* -------------------------------------------------------------------------- */
// Function to show the modal
export function showModal(nodeData) {
  const modal = document.getElementById("detail-modal")
  const modalContent = document.getElementById("modalContent")

  // Handle name which could be a string or object
  let displayName = ""
  if (typeof nodeData.data.name === 'object') {
    displayName = nodeData.data.name.en || "No Name"
  } else {
    displayName = nodeData.data.name || "No Name"
  }
  
  // Handle description which could be a string or object
  let displayDescription = ""
  if (typeof nodeData.data.description === 'object') {
    displayDescription = nodeData.data.description.en || "No Description available. Please add one!"
  } else {
    displayDescription = nodeData.data.description || "No Description available. Please add one!"
  }

  // Check if this is interaction taxonomy data (has additional fields)
  const isInteractionTaxonomy = nodeData.data.cost !== undefined || 
                                nodeData.data.accuracy !== undefined || 
                                nodeData.data.latency !== undefined
  
  // Generate additional fields for interaction taxonomy
  let additionalFields = ""
  if (isInteractionTaxonomy) {
    const technicalDetails = [
      { key: 'cost', label: 'Cost', value: nodeData.data.cost },
      { key: 'accuracy', label: 'Accuracy', value: nodeData.data.accuracy },
      { key: 'latency', label: 'Latency', value: nodeData.data.latency },
      { key: 'setup_complexity', label: 'Setup Complexity', value: nodeData.data.setup_complexity },
      { key: 'hardware_requirements', label: 'Hardware Requirements', value: nodeData.data.hardware_requirements },
      { key: 'limitations', label: 'Limitations', value: nodeData.data.limitations }
    ].filter(detail => detail.value && detail.value.trim() !== "")
    
    const useCases = nodeData.data.use_cases && nodeData.data.use_cases.length > 0 ? 
      nodeData.data.use_cases.filter(useCase => useCase && useCase.trim() !== "") : []
    
    if (technicalDetails.length > 0 || useCases.length > 0) {
      additionalFields = `
        <div class="modal-section interaction-details">
          <p><strong>Technical Details:</strong></p>
          ${technicalDetails.map(detail => 
            `<div class="detail-item"><strong>${detail.label}:</strong> ${detail.value}</div>`
          ).join("")}
          ${useCases.length > 0 ? 
            `<div class="detail-item"><strong>Use Cases:</strong> ${useCases.join(", ")}</div>` : ""}
        </div>
      `
    }
  }

  // Filter out empty links
  const validLinks = nodeData.data.links ? 
    Object.entries(nodeData.data.links).filter(([type, url]) => url && url.trim() !== "") : []
  
  // Generate content based on the clicked node data
  const content = `
    <h2>${displayName}</h2>
    <div class="modal-section">
      <p>${displayDescription}</p>
    </div>
    ${nodeData.data.tags && nodeData.data.tags.length > 0 ? 
      `<div class="modal-section">
         <p><strong>Tags:</strong> ${nodeData.data.tags.join(", ")}</p>
       </div>` : ""}
    ${additionalFields}
    ${validLinks.length > 0 ? 
      `<div class="modal-section">
         <p><strong>Links:</strong></p>
         <ul class="links-list">
           ${validLinks.map(([type, url]) => 
             `<li><strong>${type}:</strong> <a href="${url}" target="_blank">${url}</a></li>`
           ).join("")}
         </ul>
       </div>` : ""}
  `
  modalContent.innerHTML = content
  modal.style.display = "block"

  // Attach the click event listener for the close button dynamically
  const closeButton = modal.querySelector(".modalClose")
  closeButton.addEventListener("click", closeModal)
  modal.addEventListener("click", closeModal)
}

// Function to show the edit modal
export function showEditModal(nodeData) {
  const modal = document.getElementById("detail-modal")
  const modalContent = document.getElementById("modalContent")

  // Generate content based on the clicked node data with editable fields
  // Handle name which could be a string or object
  let nameEn = ""
  let nameJa = ""
  
  if (typeof nodeData.data.name === 'object') {
    nameEn = nodeData.data.name.en || ""
    nameJa = nodeData.data.name.ja || ""
  } else {
    nameEn = nodeData.data.name || ""
  }
  
  // Handle description which could be a string or object
  let descriptionText = ""
  if (typeof nodeData.data.description === 'object') {
    descriptionText = nodeData.data.description.en || ""
  } else {
    descriptionText = nodeData.data.description || ""
  }
  
  const content = `
    <h2>Edit Node</h2>
    <form id="edit-node-form">
      <div class="form-group">
        <label for="nodeName">Name (en):</label>
        <input type="text" id="nodeName" value="${nameEn}" required>
      </div>
      <div class="form-group">
        <label for="nodeNameJa">Name (ja):</label>
        <input type="text" id="nodeNameJa" value="${nameJa}">
      </div>
      <div class="form-group">
        <label for="nodeDescription">Description:</label>
        <textarea id="nodeDescription" rows="4">${descriptionText}</textarea>
      </div>
      <div class="form-group">
        <label for="nodeTags">Tags (comma separated):</label>
        <input type="text" id="nodeTags" value="${nodeData.data.tags ? nodeData.data.tags.join(", ") : ''}">
      </div>
      <div class="form-group">
        <label>Links:</label>
        <div id="links-container">
          ${
            nodeData.data.links
              ? Object.entries(nodeData.data.links)
                  .map(([type, url], index) => `
                    <div class="link-item">
                      <input type="text" class="link-type" value="${type}" placeholder="Type">
                      <input type="text" class="link-url" value="${url}" placeholder="URL">
                      <button type="button" class="remove-link" data-index="${index}">✕</button>
                    </div>
                  `)
                  .join("")
              : ''
          }
        </div>
        <button type="button" id="add-link">Add Link</button>
      </div>
      <div class="form-buttons">
        <button type="submit">Save Changes</button>
        <button type="button" id="cancelEdit">Cancel</button>
      </div>
    </form>
  `
  modalContent.innerHTML = content
  modal.style.display = "block"

  // Prevent clicks inside the modal from closing it
  modal.querySelector(".modal-content").addEventListener("click", (e) => {
    e.stopPropagation()
  })

  // Setup event listeners
  document.getElementById("cancelEdit").addEventListener("click", closeModal)
  document.getElementById("add-link").addEventListener("click", addLinkField)
  
  // Setup event listeners for remove link buttons
  const removeButtons = document.querySelectorAll(".remove-link")
  removeButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.target.closest(".link-item").remove()
    })
  })

  // Handle form submission
  const form = document.getElementById("edit-node-form")
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    saveNodeChanges(nodeData)
  })

  // Attach the click event listener for the close button
  const closeButton = modal.querySelector(".modalClose")
  closeButton.addEventListener("click", closeModal)
  modal.addEventListener("click", closeModal)
}

// Function to add a new link field
function addLinkField() {
  const linksContainer = document.getElementById("links-container")
  const linkItem = document.createElement("div")
  linkItem.className = "link-item"
  linkItem.innerHTML = `
    <input type="text" class="link-type" placeholder="Type">
    <input type="text" class="link-url" placeholder="URL">
    <button type="button" class="remove-link">✕</button>
  `
  linksContainer.appendChild(linkItem)
  
  // Add event listener to the remove button
  linkItem.querySelector(".remove-link").addEventListener("click", (e) => {
    e.target.closest(".link-item").remove()
  })
}

// Function to save changes made to a node
function saveNodeChanges(nodeData) {
  // Get values from form
  const name = document.getElementById("nodeName").value
  const nameJa = document.getElementById("nodeNameJa").value
  const description = document.getElementById("nodeDescription").value
  const tagsString = document.getElementById("nodeTags").value
  
  // Process tags
  const tags = tagsString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
  
  // Process links
  const links = {}
  const linkItems = document.querySelectorAll(".link-item")
  linkItems.forEach(item => {
    const type = item.querySelector(".link-type").value.trim()
    const url = item.querySelector(".link-url").value.trim()
    if (type && url) {
      links[type] = url
    }
  })
  
  // Update the node data
  // For name, we need to handle the multilingual structure
  if (nodeData.data.name && typeof nodeData.data.name === 'object') {
    nodeData.data.name.en = name
    if (nameJa) {
      nodeData.data.name.ja = nameJa
    }
  } else {
    // If it's a string, convert to object
    nodeData.data.name = { en: name }
    if (nameJa) {
      nodeData.data.name.ja = nameJa
    }
  }
  
  // Update description
  if (nodeData.data.description && typeof nodeData.data.description === 'object') {
    nodeData.data.description.en = description
  } else {
    // Convert to object format for consistency
    nodeData.data.description = { en: description }
  }
  
  nodeData.data.tags = tags
  nodeData.data.links = links
  
  // Close modal, show feedback, and refresh visualization
  closeModal()
  
  // Show feedback notification
  const notification = document.createElement('div')
  notification.className = 'notification'
  notification.textContent = `Updated node: ${name}`
  document.body.appendChild(notification)
  
  // Auto remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out')
    setTimeout(() => notification.remove(), 500)
  }, 3000)
  
  // Update currentJson which will be used for saving
  import("./taxonomy_tree_visualizer.js").then(module => {
    module.updateCurrentJson()
  })
  
  refreshVisualizeWithSync() // This function needs to be accessible
}

// Function to show the add child node modal
export function showAddChildModal(parentNode) {
  const modal = document.getElementById("detail-modal")
  const modalContent = document.getElementById("modalContent")

  // Generate content for adding a new child node
  const content = `
    <h2>Add New Child Node</h2>
    <form id="add-node-form">
      <div class="form-group">
        <label for="newNodeName">Name (en):</label>
        <input type="text" id="newNodeName" required placeholder="Node name in English">
      </div>
      <div class="form-group">
        <label for="newNodeNameJa">Name (ja):</label>
        <input type="text" id="newNodeNameJa" placeholder="Node name in Japanese (optional)">
      </div>
      <div class="form-group">
        <label for="newNodeDescription">Description:</label>
        <textarea id="newNodeDescription" rows="4" placeholder="Node description"></textarea>
      </div>
      <div class="form-group">
        <label for="newNodeTags">Tags (comma separated):</label>
        <input type="text" id="newNodeTags" placeholder="tag1, tag2, tag3">
      </div>
      <div class="form-group">
        <label>Links:</label>
        <div id="new-links-container"></div>
        <button type="button" id="add-new-link">Add Link</button>
      </div>
      <div class="form-buttons">
        <button type="submit">Add Node</button>
        <button type="button" id="cancelAdd">Cancel</button>
      </div>
    </form>
  `
  modalContent.innerHTML = content
  modal.style.display = "block"

  // Prevent clicks inside the modal from closing it
  modal.querySelector(".modal-content").addEventListener("click", (e) => {
    e.stopPropagation()
  })

  // Setup event listeners
  document.getElementById("cancelAdd").addEventListener("click", closeModal)
  document.getElementById("add-new-link").addEventListener("click", () => {
    addNewLinkField("new-links-container")
  })

  // Handle form submission
  const form = document.getElementById("add-node-form")
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    addChildNode(parentNode)
  })

  // Attach the click event listener for the close button
  const closeButton = modal.querySelector(".modalClose")
  closeButton.addEventListener("click", closeModal)
  modal.addEventListener("click", closeModal)
}

// Function to add a new link field for the add node form
function addNewLinkField(containerId) {
  const linksContainer = document.getElementById(containerId)
  const linkItem = document.createElement("div")
  linkItem.className = "link-item"
  linkItem.innerHTML = `
    <input type="text" class="link-type" placeholder="Type">
    <input type="text" class="link-url" placeholder="URL">
    <button type="button" class="remove-link">✕</button>
  `
  linksContainer.appendChild(linkItem)
  
  // Add event listener to the remove button
  linkItem.querySelector(".remove-link").addEventListener("click", (e) => {
    e.target.closest(".link-item").remove()
  })
}

// Function to add a new child node
function addChildNode(parentNode) {
  // Get values from form
  const name = document.getElementById("newNodeName").value
  const nameJa = document.getElementById("newNodeNameJa").value
  const description = document.getElementById("newNodeDescription").value
  const tagsString = document.getElementById("newNodeTags").value
  
  // Process tags
  const tags = tagsString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
  
  // Process links
  const links = {}
  const linkItems = document.querySelectorAll("#new-links-container .link-item")
  linkItems.forEach(item => {
    const type = item.querySelector(".link-type").value.trim()
    const url = item.querySelector(".link-url").value.trim()
    if (type && url) {
      links[type] = url
    }
  })
  
  // Create the new node object with proper multilingual structure
  const newNode = {
    name: {
      en: name
    },
    description: {
      en: description
    },
    tags: tags,
    links: links,
    children: []
  }
  
  // Add Japanese name if provided
  if (nameJa) {
    newNode.name.ja = nameJa
  }
  
  // We need to add the child to the original currentJson, not just the d3 hierarchy
  // First, let's get the current JSON and find the parent node in it
  import("./taxonomy_tree_visualizer.js").then(module => {
    const currentJson = module.getCurrentJson()
    
    // Find the parent node in the original JSON structure by matching the name
    function findNodeInJson(node, targetName) {
      if (node.name && 
          ((typeof node.name === 'string' && node.name === targetName) ||
           (typeof node.name === 'object' && (node.name.en === targetName || node.name.ja === targetName)))) {
        return node
      }
      
      if (node.children) {
        for (let child of node.children) {
          const found = findNodeInJson(child, targetName)
          if (found) return found
        }
      }
      
      return null
    }
    
    // Get the parent's display name for matching
    let parentDisplayName = ""
    if (typeof parentNode.data.name === 'object') {
      parentDisplayName = parentNode.data.name.en || parentNode.data.name.ja
    } else {
      parentDisplayName = parentNode.data.name
    }
    
    const jsonParentNode = findNodeInJson(currentJson, parentDisplayName)
    
    if (jsonParentNode) {
      // Add the new node to the JSON structure
      if (!jsonParentNode.children) {
        jsonParentNode.children = []
      }
      jsonParentNode.children.push(newNode)
      
      console.log("Added new node to JSON:", newNode)
      console.log("JSON parent node after addition:", jsonParentNode)
      
      // Close modal and show feedback
      closeModal()
      
      // Show feedback notification
      const notification = document.createElement('div')
      notification.className = 'notification'
      notification.textContent = `Added new node: ${name}`
      document.body.appendChild(notification)
      
      // Auto remove notification after 3 seconds
      setTimeout(() => {
        notification.classList.add('fade-out')
        setTimeout(() => notification.remove(), 500)
      }, 3000)
      
      // Refresh the visualization which will rebuild from the updated JSON
      module.refreshVisualize()
    } else {
      console.error("Could not find parent node in JSON structure")
      closeModal()
    }
  })
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("detail-modal")
  modal.style.display = "none"
}

// Add this function to handle the toggle action for the "About this page" box
function toggleAboutBox() {
  const aboutBox = document.getElementById("about-page")
  if (aboutBox.style.display === "none") {
    aboutBox.style.display = "block"
  } else {
    aboutBox.style.display = "none"
  }
}
function closeAboutBox() {
  document.getElementById("about-page").style.display = "none"
}

// Add an event listener for the "About this page" button
document.querySelector("#toggleAboutBox").addEventListener("click", toggleAboutBox)
document.querySelector(".modalClose.about").addEventListener("click", closeAboutBox)
document.querySelector("#about-page").addEventListener("click", closeAboutBox)
