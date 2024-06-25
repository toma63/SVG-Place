let cells = null;
let block = null;
let pixelRatio = 1 / 400; // pixels = dbus * pixel_ratio - autoscale based on block size
canvas = document.getElementById("svg-canvas");
canvasContainer = document.getElementById('svg-container');

// load the cell definition JSON file
document.getElementById('cell-file').addEventListener('change', function() {
    let file = this.files[0];
    let reader = new FileReader();
    
    reader.onload = function(e) {
        // Parse the JSON text into an object
        cells = JSON.parse(e.target.result);
    };
    
    reader.readAsText(file); // Read the file as text
});
// load the block definition JSON file
document.getElementById('block-file').addEventListener('change', function() {
    let file = this.files[0];
    let reader = new FileReader();
    
    reader.onload = function(e) {
        // Parse the JSON text into an object
        block = JSON.parse(e.target.result);
        displayBlock();
    };
    
    reader.readAsText(file); // Read the file as text
});

// adjust y for lower left origin
function fixY(blockY) {
    return canvas.getAttribute('height') - (blockY * pixelRatio);    
}

function scaleToPix(blockX) {
    return blockX * pixelRatio; 
}

function addRect(x, y, w, h, id, cssClass) {
    let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', scaleToPix(x));
    rect.setAttribute('y', fixY(y));
    rect.setAttribute('width', scaleToPix(w));
    rect.setAttribute('height', scaleToPix(h));
    rect.setAttribute('id', id);
    rect.setAttribute('class', cssClass);
    canvas.appendChild(rect);
}

// full viewBox string
function setFullViewBox() {
    vw = canvas.getAttribute('width');
    vh = canvas.getAttribute('height');
    canvas.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
}

// Update the svg canvas when a block definition is loaded
function displayBlock() {
    
    // scale the canvas to match the block
    let blockDBUWidth = block.area[1].x - block.area[0].x;
    let blockDBUHeight = block.area[1].y - block.area[0].y;
    pixelRatio = 1000 / blockDBUWidth;
    canvas.setAttribute('width', blockDBUWidth * pixelRatio);
    canvas.setAttribute('height', blockDBUHeight * pixelRatio);
    
    // display the placement rows
    for (let rowDef of block.rows) {
        let xStep = block.sites[rowDef.site].width;
        let yStep = block.sites[rowDef.site].height;
        for (let rowNum = 0 ; rowNum < rowDef.ysteps ; rowNum++) {
            let rowWidth = xStep * rowDef.xsteps ;
            addRect(rowDef.x, rowDef.y + rowNum * yStep, rowWidth, yStep, rowDef.name + `_${rowNum}`, 'row-rect');
        }
    }

    // display placed cells
    if (cells) {
        for (let comp of block.components) {
            let cell = cells[comp.master];
            if (! cell) {
                throw(`master ${comp.master} not defined`);
            }
            addRect(comp.placed.x, comp.placed.y, cell.size.width, cell.size.height, comp.name, 'placed-cell');
        }
    }
}

// get a selected box for zooming
let rubberbandRect = null;
let startX, startY;

// convert to SVG coordinates
function getSVGCoords(event) {
    const svgPoint = canvas.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const transformedPoint = svgPoint.matrixTransform(canvas.getScreenCTM().inverse());
    return { x: transformedPoint.x, y: transformedPoint.y };
}

// start zoom box rubberbanding
canvas.addEventListener('mousedown', function(event) {
    const coords = getSVGCoords(event);
    startX = coords.x;
    startY = coords.y;
  
    rubberbandRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rubberbandRect.setAttribute('x', startX);
    rubberbandRect.setAttribute('y', startY);
    rubberbandRect.setAttribute('width', 0);
    rubberbandRect.setAttribute('height', 0);
    rubberbandRect.setAttribute('stroke', 'black');
    rubberbandRect.setAttribute('stroke-width', '1');
    rubberbandRect.setAttribute('fill', 'none');
    rubberbandRect.setAttribute('id', 'rubber-rect');
    canvas.appendChild(rubberbandRect);
  
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
  });

  // update rubberband box on mouse movement
  function onMouseMove(event) {
    const coords = getSVGCoords(event);
    const width = Math.abs(coords.x - startX);
    const height = Math.abs(coords.y - startY);
  
    rubberbandRect.setAttribute('width', width);
    rubberbandRect.setAttribute('height', height);
    rubberbandRect.setAttribute('x', Math.min(coords.x, startX));
    rubberbandRect.setAttribute('y', Math.min(coords.y, startY));
  }

  // on mouseup, hide rubberband box and perform zoom
  function onMouseUp(event) {
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.setAttribute('viewBox', `${rubberbandRect.x.baseVal.value} ${rubberbandRect.y.baseVal.value} ${rubberbandRect.width.baseVal.value} ${rubberbandRect.height.baseVal.value}`);
    rubberbandRect.remove();
}

// zoom full on hotkey 'f' (70)
document.addEventListener('keyup', function(event) {
    if (event.key === 70) { // 'f' key pressed
        setFullViewBox();
    }
});
