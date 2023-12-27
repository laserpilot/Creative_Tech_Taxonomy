/* -------------------------------------------------------------------------- */
/*                            show and close modal                            */
/* -------------------------------------------------------------------------- */
// Function to show the modal
export function showModal(nodeData) {
  const modal = document.getElementById("detail-modal")
  const modalContent = document.getElementById("modalContent")

  // Generate content based on the clicked node data
  const content = `
    <h2>${nodeData.data.name}</h2>
    <p>${nodeData.data.description || "No Description available. Please add one!"}</p>
    <p>Tags: ${nodeData.data.tags ? nodeData.data.tags.join(", ") : "No Tags available."}</p>
    <div class="links-container">
      <p>Links:</p>
      <ul>
        ${
          nodeData.data.links
            ? Object.entries(nodeData.data.links)
                .map(([type, url]) => `<li>${type}: <a href="${url}" target="_blank">${url}</a></li>`)
                .join("")
            : "No links available."
        }
      </ul>
    </div>
  `
  modalContent.innerHTML = content
  modal.style.display = "block"

  // Attach the click event listener for the close button dynamically
  const closeButton = modal.querySelector(".modalClose")
  closeButton.addEventListener("click", closeModal)
  modal.addEventListener("click", closeModal)
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
