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


// take screenshot
function takeScreenshot() {
    html2canvas(document.querySelector("#container")).then(canvas => {
        canvas.style.display = 'none'
        // document.querySelector("#container").style.display = "none";
        const context = canvas.getContext('2d');
        context.resetTransform();
        // Draw the watermark text
        context.font = '48px Arial';
        context.fillStyle = 'rgba(100, 100, 100, 0.5)';
        context.fillText('Creative Tech Taxonomy by https://github.com/laserpilot/Creative_Tech_Taxonomy', 200, 100);
        document.body.appendChild(canvas)
        return canvas
    })
    .then(canvas => {
        const image = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        
        a.setAttribute('download', 'creative-tech-taxonomy-screenshot.png');
        a.setAttribute('href', image);
        a.click();
        // canvas.remove();
    })
}

document.getElementById("take-screenshot").addEventListener("click", takeScreenshot);



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

// handle toggle fold actions
export function toggleFold() {
    var checkbox = document.getElementById("foldToggle");
    var toggleText = document.getElementById("toggleFoldText");

    if (checkbox.checked) {
        toggleText.textContent = "Toggle to Expand All";
        return true;
    } else {
        toggleText.textContent = "Toggle to Fold All";
        return false;
    }
}

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
