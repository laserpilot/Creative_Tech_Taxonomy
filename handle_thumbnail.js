document.addEventListener('DOMContentLoaded', function () {
    const mainCanvas = document.getElementById('container');
    const thumbnailCanvas = document.getElementById('thumbnailCanvas');
    const thumbnailOverlay = document.getElementById('thumbnailOverlay');
    
    const mainCtx = mainCanvas.getContext('2d');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');

    // Function to capture the current state of the main canvas and update the thumbnail
    function updateThumbnail() {
        html2canvas(mainCanvas).then(canvas => {
            thumbnailCtx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
            thumbnailCtx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        });
    }

    // Function to handle drawing on the thumbnail and updating the main canvas
    function handleThumbnailDraw(event) {
        const rect = thumbnailCanvas.getBoundingClientRect();
        const scaleX = thumbnailCanvas.width / rect.width;
        const scaleY = thumbnailCanvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Draw on the main canvas based on the thumbnail interaction
        mainCtx.beginPath();
        mainCtx.arc(x, y, 5, 0, 2 * Math.PI);
        mainCtx.fillStyle = 'red';
        mainCtx.fill();

        // Update the thumbnail to reflect the changes in the main canvas
        updateThumbnail();
    }

    // Initial update and set interval for periodic updates
    updateThumbnail();
    setInterval(updateThumbnail, 5000); // Update every 5 seconds (adjust as needed)

    // Add event listener for drawing on the thumbnail
    thumbnailOverlay.addEventListener('mousemove', handleThumbnailDraw);
});
