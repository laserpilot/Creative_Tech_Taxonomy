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