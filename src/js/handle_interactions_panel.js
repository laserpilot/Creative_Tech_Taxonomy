/* handle functions for interactions panel */
import html2canvas from "html2canvas"

// take screenshot
function takeScreenshot() {
  html2canvas(document.querySelector("#visualizer"))
    .then((canvas) => {
      canvas.style.display = "none"
      // document.querySelector("#container").style.display = "none";
      const context = canvas.getContext("2d")
      context.resetTransform()
      // Draw the watermark text
      context.font = "48px Arial"
      context.fillStyle = "rgba(100, 100, 100, 0.5)"
      context.fillText("Creative Tech Taxonomy by https://github.com/laserpilot/Creative_Tech_Taxonomy", 200, 100)
      document.body.appendChild(canvas)
      return canvas
    })
    .then((canvas) => {
      const image = canvas.toDataURL("image/png")
      const a = document.createElement("a")

      a.setAttribute("download", "creative-tech-taxonomy-screenshot.png")
      a.setAttribute("href", image)
      a.click()
      canvas.remove()
    })
}
document.getElementById("takeScreenshot").addEventListener("click", takeScreenshot)

// handle toggle actions
function changeTab(event) {
  const elements = document.getElementsByName("tab")
  let checkValue = ""

  for (let i = 0; i < elements.length; i++) {
    if (elements.item(i).checked) {
      checkValue = elements.item(i).value
    }
  }

  if (checkValue === "tree") {
    document.querySelector("#visualizer").style.display = "block"
    document.querySelector("#editor").style.display = "none"
    document.querySelector("footer").style.display = "block"
    document.querySelector("menu").style.display = "block"
  } else {
    document.querySelector("#visualizer").style.display = "none"
    document.querySelector("#editor").style.display = "block"
    document.querySelector("footer").style.display = "none"
    document.querySelector("menu").style.display = "none"
  }
}
document.querySelectorAll('input[name="tab"]').forEach((elem) => {
  elem.addEventListener("change", changeTab)
})

// handle download json
export function downloadJSON(jsonEdit) {
  // get json data
  const json = JSON.stringify(jsonEdit.get(), null, "  ")
  // create a blob object representing the data as a JSON string
  const blob = new Blob([json], { type: "application/json" })
  // create dummy element
  let dummyElement = document.createElement("a")
  document.body.appendChild(dummyElement)
  // set its download attribute and href to that of the blob
  dummyElement.href = window.URL.createObjectURL(blob)
  // set its name
  dummyElement.download = "Creative_Tech_Taxonomy_data.json"
  // trigger click on dummy element to initiate download
  dummyElement.click()
  // remove dummy element
  document.body.removeChild(dummyElement)
  console.log("downloaded json")
}
