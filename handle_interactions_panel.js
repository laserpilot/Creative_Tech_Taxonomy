import JSONEditor from "https://cdn.jsdelivr.net/npm/jsoneditor@9.10.4/+esm";


// handle zoom actions
function zoomIn() {
    document.getElementById("container").classList.add("zoom-in");

    // Get the current scale
    const currentScale = window.getComputedStyle(container).transform;
    const currentScaleValue = currentScale.slice(7, -1).split(', ')[0] || 1;

    // Calculate the new scale factor and apply the zoom-in class
    const newScale = parseFloat(currentScaleValue) * 1.2;
    container.style.transform = `scale(${newScale})`;
}
function zoomOut() {
    document.getElementById("container").classList.add("zoom-out");

    const currentScale = window.getComputedStyle(container).transform;
    const currentScaleValue = currentScale.slice(7, -1).split(', ')[0] || 1;

    // Calculate the new scale factor and apply the zoom-in class
    const newScale = parseFloat(currentScaleValue) * 0.8;
    container.style.transform = `scale(${newScale})`;
}
function resetZoom() {
    document.getElementById("container").classList.remove("zoom-in");
    document.getElementById("container").classList.remove("zoom-out");

    container.style.transform = `scale(1)`;
}
document.getElementById("zoom-in-button").addEventListener("click", zoomIn);
document.getElementById("zoom-out-button").addEventListener("click", zoomOut);
document.getElementById("reset-button").addEventListener("click", resetZoom);


// handle toggle actions
function toggleView() {
    var checkbox = document.getElementById("viewToggle");
    var toggleText = document.getElementById("toggleText");
    if (checkbox.checked) {
    toggleText.textContent = "Taxonomy View";
    document.querySelector("#visualizer").style.display = "block";
    document.querySelector("#editor").style.display = "none";
    } else {
    toggleText.textContent = "Json View"; 
    document.querySelector("#visualizer").style.display = "none";
    document.querySelector("#editor").style.display = "block";
    }
}
document.getElementById("viewToggle").addEventListener("change", toggleView);

// handle download json 
export function downloadJSON(jsonEdit) {
    // get json data
    const json = JSON.stringify(jsonEdit.get(), null, "  ");
    // create a blob object representing the data as a JSON string
    const blob = new Blob([json], { type: "application/json" });
    // create dummy element
    let dummyElement = document.createElement("a");
    document.body.appendChild(dummyElement);
    // set its download attribute and href to that of the blob
    dummyElement.href = window.URL.createObjectURL(blob);
    // set its name
    dummyElement.download = "Creative_Tech_Taxonomy_data.json";
    // trigger click on dummy element to initiate download
    dummyElement.click();
    // remove dummy element
    document.body.removeChild(dummyElement);
    console.log("downloaded json")
}
