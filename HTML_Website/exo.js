
const SIZE = 512;

document.getElementById('imageInput').addEventListener('change', function (event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
        };

        const errorText = document.getElementById('resultText');
        errorText.innerHTML = '';

        reader.readAsDataURL(file);
    }
});

/**
 * Determines whether a pixel is in a circle, given the pixel's coordinates and the circle's diameter
 * @param {number} s The diameter of the circle 
 * @param {number} x The x-coordinate of the pixel
 * @param {number} y The y-coordinate of the pixel
 * @returns True if the pixel is in the circle
 */
function pixel_in_circle(s, x, y){
    // We don't actually need to calculate the distance
    // So there's no need to use sqrt
    return (Math.pow(x - s/2, 2) + Math.pow(y - s/2, 2)) < Math.pow(s/2, 2);
}

function checkSaturation(pixels){
    let isColorful = true;
    try{
    for(let i = 0; isColorful && i < SIZE; i += 1){ // Search per row
        //j = 0;
        for(let j = 0; isColorful && j < SIZE-1; j += 1){
            if(pixel_in_circle(SIZE, i, j)){
                const position = 4*(512*i + j);
                const alpha = pixels[position + 3];
                if(alpha != 0){
                    const red = pixels[position];
                    const green = pixels[position + 1];
                    const blue = pixels[position + 2];
                    const maxRGB = Math.max(red, green, blue);
                    const minRGB = Math.min(red, green, blue);

                    const lum = (maxRGB + minRGB)/510; // 255*2

                    let sat = 0.0;
                    // Using ints to avoid FPEs
                    if((maxRGB + minRGB) < 510){
                        sat = (maxRGB - minRGB) / (255*(1 - Math.abs(2*lum - 1)));
                    }
                    isColorful = (lum >= 0.5) && (sat > 0.37);
                    //if(!isColorful) alert(`Failed! ${lum} ${sat} ${pixels.slice(position, position + 4)}`);
                }
            }
        }
    }
    } catch (error){
        alert(`${error}`);
    }
    return isColorful;
}

function checkImageAlpha(pixels) {
    let isCircle = true;
    //let pixelNb = 0;
    //let i = 0, j = 0, position = 0;
    for(let i = 0; isCircle && i < SIZE; i += 1){ // Search per row
        //j = 0;
        for(let j = 0; isCircle && j < SIZE; j += 1){
            if(!pixel_in_circle(SIZE, i, j)){
                const position = 3 + 4*(512*i + j);
                isCircle = (pixels[position] == 0); // pixels[i] is the alpha channel
                //pixelNb = pixelNb + 1;
            }
        }
    }
    //alert(`${pixels.slice(-40)}`)
    //alert(`Pixel nb: "${i}" and "${j}" at ${position}/${pixels.length}, with "${pixelNb}" pixels checked. "${isCircle}"`);
    return isCircle;
}

function checkImage(img) {
    // Recreating temp image to be able to analyse it
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0, img.width, img.height);

    const imageData = context.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;

    // We might as well reuse the canvas to check the different conditions necessary
    const hasCorrectAlpha = checkImageAlpha(pixels);
    if(!hasCorrectAlpha) return 1;

    const hasCorrectSat = checkSaturation(pixels);
    if(!hasCorrectSat) return 2;
    return 0;
}

function checkSize(img) {
    // Set the desired resolution
    const desiredWidth = 512;
    const desiredHeight = 512;

    // Check if the image has the correct resolution
    return (img.width == desiredWidth && img.height == desiredHeight);
}

function handleImageLoad(file, fileInput) {
    const desiredWidth = 512;
    const desiredHeight = 512;

    const img = new Image();
    img.onload = function () {
        const isCorrectSize = checkSize(img);
        const res = document.getElementById('resultText');
        if(!isCorrectSize) {
            res.innerHTML = '<p>Invalid. Image resolution must be ' + desiredWidth + 'x' + desiredHeight + '.</p>';
            return;
        }

        const isValid = checkImage(img);
        //alert(`isValid: ${isValid}`);

        // Since we're using the same function to check different conditions,
        // we'll use a switch-case to determine what errors there are
        switch(isValid){
            case 0:
                document.getElementById('uploadForm').submit();
                break;
            case 1:
                res.innerHTML = '<p>Invalid. The image\'s must fit within a circle.</p>';
                break;
            case 2:
                res.innerHTML = '<p>Invalid. The image is not colorful enough.</p>';
                break;
            default:
                res.innerHTML = '<p>Invalid. The image wasn\'t correctly processed.</p>';
                break;
        }
        return;
    };
    img.src = file;
}

document.getElementById('imageUpload').addEventListener('click', function () {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            handleImageLoad(e.target.result, fileInput);
        };

        reader.readAsDataURL(file);
    }
});