let cells = null;
let block = null;
const pixelRatio = 400; // pixels = dbus / pixel_ratio
canvas = document.getElementById("svg-canvas");
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
    return canvas.getAttribute('height') - (blockY / pixelRatio);    
}

function scaleToPix(blockX) {
    return blockX / pixelRatio; 
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

// Update the svg canvas when a block definition is loaded
function displayBlock() {
    
    // scale the canvas to match the block
    canvas.setAttribute('width', (block.area[1].x - block.area[0].x) / pixelRatio);
    canvas.setAttribute('height', (block.area[1].y - block.area[0].y) / pixelRatio);
    
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