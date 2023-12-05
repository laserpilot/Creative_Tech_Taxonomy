
function captureThumbnail() {
    var thumbnailIframe = document.getElementById('thumbnail-iframe');

    // Use html2canvas library to capture the thumbnail
    html2canvas(document.body,{
        logging: true,
        profile: true,
        useCORS: true
        }).then(function(canvas){

        // document.body.appendChild(canvas);
        // canvas.width = 1024;
        // canvas.height = 768;
        // canvas.style.zIndex = 8;
        // let thumbnailDiv = document.getElementById("thumbnail-container");
        // thumbnailDiv.appendChild(canvas); 

        console.log(canvas);
        // Convert the canvas to a data URL
        var thumbnailDataURL = canvas.toDataURL();
        console.log(thumbnailDataURL);
        // Set the data URL as the source of the iframe
        thumbnailIframe.src = thumbnailDataURL;
    });
};


window.addEventListener('resize', function() {
    captureThumbnail();
});

window.onload = function() {
    captureThumbnail();
};


// window.addEventListener('load', function() {
//     captureThumbnail();
// });


/*  past approach -- use iframe
// Get the current page URL
var currentPageURL = window.location.href;

// Set the iframe source to the current page URL
document.getElementById('thumbnail-iframe').src = currentPageURL;

// Set the iframe dimensions to scale with the viewport
function setThumbnailDimensions() {
    var thumbnailIframe = document.getElementById('thumbnail-iframe');
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var originalPageWidth =  window.parent.document.documentElement.scrollWidth;
    var originalPageHeight = window.parent.document.documentElement.scrollHeight;

    // Calculate the width/height ratio of the original page
    var pageRatio = originalPageWidth / originalPageHeight;

    // Calculate the desired height based on the width/scrollHeight ratio
    var desiredHeight = originalPageHeight ;

    // Resize the page by the viewportWidth/pageRatio
    var newWidth = viewportWidth / pageRatio;
    

    // Set the iframe dimensions
    thumbnailIframe.style.width = viewportWidth + 'px';
    thumbnailIframe.style.height = desiredHeight + 'px';
    
    html2canvas(document.getElementById("container")).then(function(canvas) {
        document.getElementById('thumbnail-container').appendChild(canvas);
    });
}

//hide iframe within itself
if (window !== window.parent) {
    document.getElementById('thumbnail-container').style.display = 'none';
}

// Call the function initially and on window resize
setThumbnailDimensions();
window.addEventListener('resize', setThumbnailDimensions);

*/