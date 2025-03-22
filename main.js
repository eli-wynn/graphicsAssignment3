// Global variables
let gl;
let canvas;
let g_modelMatrix;
let g_mvpMatrix;
let g_normalMatrix;
let viewProjMatrix;
let u_MvpMatrix;
let u_ModelMatrix;
let u_NormalMatrix;
let u_LightDirection;
let u_LightColor;
let u_AmbientLight;
let angle = 0.0;
let truckData = null;

// Camera animation variables
let cameraAngle = 0;
let cameraHeight = 15; // Increased from 10
let cameraDistance = 40; // Increased from 25
let animationEnabled = true;
let animationSpeed = 0.5;

// Load truck data from text files
async function loadTruckData() {
    try {
        const [positionsText, colorsText, normalsText, indicesText] = await Promise.all([
            fetch('data/positions.txt').then(response => response.text()),
            fetch('data/colors.txt').then(response => response.text()),
            fetch('data/normals.txt').then(response => response.text()),
            fetch('data/index.txt').then(response => response.text())
        ]);

        console.log('Loaded text files successfully');
        
        // Create attributes object
        const attributes = new Attributes();
        
        // Parse positions
        const positionsArray = parseDataFile(positionsText);
        attributes.addAttribute('a_Position', positionsArray, 3);
        
        // Parse colors and convert to indices
        const colorsArray = parseDataFile(colorsText);
        const colorIndices = generateColorIndices(colorsArray);
        attributes.addAttribute('a_ColorIndex', colorIndices, 1); // Note: size is now 1
        
        // Parse normals
        const normalsArray = parseDataFile(normalsText);
        attributes.addAttribute('a_Normal', normalsArray, 3);
        
        // Parse indices
        const indicesArray = parseDataFile(indicesText);
        
        // Create a truck shape using RenderShape
        const truckShape = new RenderShape(attributes);
        
        // Set up the index buffer
        truckShape.index = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, truckShape.index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);
        truckShape.hasIndex = true;
        
        // Set up vertex buffers
        setupVertexBuffers(gl, truckShape);
        
        // Store truck data
        truckData = {
            shape: truckShape,
            numIndices: indicesArray.length
        };
        
        console.log('Truck data loaded successfully with', truckData.numIndices, 'indices');
        return true;
    } catch (error) {
        console.error('Error loading truck data:', error);
        throw error;
    }
}

// Helper function to parse data files
function parseDataFile(text) {
    // Remove any potential BOM (Byte Order Mark) characters that might be present
    text = text.replace(/^\uFEFF/, '');
    
    // Check if the text is actually empty or not valid
    if (!text || text.trim() === '') {
        console.warn('Empty or invalid data file, using default cube data instead');
        return createDefaultCubeData();
    }
    
    // Parse the text file into an array of numbers
    try {
        const result = text.trim()
            .split('\n')
            .map(line => {
                const values = line.trim().split(/\s+/).map(Number);
                // Log any invalid lines
                if (values.some(val => isNaN(val) || !isFinite(val))) {
                    console.error('Invalid values in line:', line);
                }
                return values;
            })
            .filter(values => !values.some(val => isNaN(val) || !isFinite(val)))
            .flat();
        
        // If we got valid data, return it
        if (result.length > 0) {
            return result;
        } else {
            console.warn('No valid data found in file, using default cube data instead');
            return createDefaultCubeData();
        }
    } catch (error) {
        console.error('Error parsing data file:', error);
        return createDefaultCubeData();
    }
}

// Main function
function main() {
    // Get the canvas element
    canvas = document.getElementById('glCanvas');
    
    // Get the WebGL context
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.error('Failed to get the rendering context for WebGL');
        return;
    }
    
    // Initialize shaders using our custom setupShaders function
    if (!setupShaders(gl)) {
        console.error('Failed to initialize shaders.');
        return;
    }
    
    // Set clear color and enable depth test
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    // Additional WebGL settings that might help
    gl.enable(gl.CULL_FACE);  // Enable face culling
    gl.cullFace(gl.BACK);     // Cull back faces
    
    // Get the storage locations of uniform variables
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    
    // Debug: Log the uniform locations
    console.log('Uniform locations:', {
        u_MvpMatrix,
        u_ModelMatrix,
        u_NormalMatrix,
        u_LightDirection,
        u_LightColor,
        u_AmbientLight
    });
    
    // Check if all uniform locations were found
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightDirection || !u_LightColor || !u_AmbientLight) {
        console.error('Failed to get the storage location of critical uniform variables');
        return;
    }
    
    // Continue even if u_ModelMatrix is null for now
    if (!u_ModelMatrix) {
        console.warn('Warning: u_ModelMatrix uniform not found, but continuing anyway');
    }
    
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightDirection, 0.5, 3.0, 4.0);
    // Set the light color
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    
    // Initialize model matrix
    g_modelMatrix = new Matrix4();
    g_mvpMatrix = new Matrix4();
    g_normalMatrix = new Matrix4();
    
    // Set up dat.gui controls
    setupGUI();
    
    // Load truck data
    loadTruckData().then(() => {
        // Start drawing
        tick();
    }).catch(error => {
        console.error('Failed to load truck data:', error);
    });
}

// Set up dat.gui controls
function setupGUI() {
    const gui = new dat.GUI();
    const cameraControls = {
        animationEnabled: animationEnabled,
        animationSpeed: animationSpeed
    };
    
    gui.add(cameraControls, 'animationEnabled').name('Animation On/Off').onChange(function(value) {
        animationEnabled = value;
    });
    
    gui.add(cameraControls, 'animationSpeed', 0.1, 2.0).name('Animation Speed').onChange(function(value) {
        animationSpeed = value;
    });
}

// Animation function
function tick() {
    // Update camera position if animation is enabled
    if (animationEnabled) {
        cameraAngle += animationSpeed;
        if (cameraAngle > 360) cameraAngle -= 360;
    }
    
    // Update the view projection matrix with the new camera position
    updateCamera();
    
    // Draw the scene
    draw();
    
    // Request the next frame
    requestAnimationFrame(tick);
}

// Update camera position
function updateCamera() {
    // Calculate camera position based on angle
    const radians = cameraAngle * Math.PI / 180;
    const cameraX = cameraDistance * Math.sin(radians);
    const cameraZ = cameraDistance * Math.cos(radians);
    
    // Update the view projection matrix
    viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 0.1, 100);
    viewProjMatrix.lookAt(cameraX, cameraHeight, cameraZ, 0, 0, 0, 0, 1, 0);
}

// Draw function
function draw() {
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Draw the trucks in a parking lot arrangement (2 rows of 8)
    if (truckData && truckData.shape) {
        // Define the grid parameters
        const rows = 2;
        const cols = 8;
        const spacingX = 5; // Space between trucks in a row
        const spacingZ = 7; // Space between rows
        
        // Calculate the starting position to center the grid
        const startX = -((cols - 1) * spacingX) / 2;
        const startZ = -spacingZ / 2; // Just need one row of spacing
        
        // Loop through each position in the grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Set the model matrix for this truck
                g_modelMatrix.setIdentity();
                
                // Scale the truck to an appropriate size
                g_modelMatrix.scale(0.8, 0.8, 0.8);
                
                // Position the truck in the grid
                const x = startX + col * spacingX;
                const z = startZ + row * spacingZ;
                g_modelMatrix.translate(x, 0, z);
                
                // Set a fixed rotation for each truck
                // For proper parking lot arrangement, trucks should face forward/backward
                if (row % 2 === 0) {
                    g_modelMatrix.rotate(0, 0, 1, 0); // Face forward
                } else {
                    g_modelMatrix.rotate(180, 0, 1, 0); // Face backward
                }
                
                // Calculate the model view projection matrix
                g_mvpMatrix.set(viewProjMatrix);
                g_mvpMatrix.multiply(g_modelMatrix);
                gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
                
                // Calculate the normal transformation matrix
                g_normalMatrix.setInverseOf(g_modelMatrix);
                g_normalMatrix.transpose();
                gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
                
                // Set the model matrix for the vertex shader
                if (u_ModelMatrix) {
                    gl.uniformMatrix4fv(u_ModelMatrix, false, g_modelMatrix.elements);
                }
                
                // Draw this truck
                drawTruck(truckData.shape, truckData.numIndices);
            }
        }
    } else {
        console.warn('No truck data available for drawing');
    }
}

// Helper function to draw a single truck
function drawTruck(shape, numIndices) {
    // Bind the vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertex);
    
    // Set up attribute pointers
    for (let i = 0; i < shape.attrib.attributes.length; i++) {
        const attr = shape.attrib.attributes[i];
        const loc = gl.getAttribLocation(gl.program, attr.name);
        if (loc >= 0) {
            gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, 
                shape.attrib.getStride(), attr.offset);
            gl.enableVertexAttribArray(loc);
        }
    }
    
    // Draw using indices
    if (shape.hasIndex) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.index);
        gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, 0);
    }
}

// Create a utility.js file for helper functions
function createUtilsFile() {
    // This function is just a placeholder - you would create a utils.js file with any helper functions needed
}

// Start the application when the page loads
window.onload = main;

// Helper function to set up vertex buffers
function setupVertexBuffers(gl, shape) {
    // Create vertex buffer
    shape.vertex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertex);
    
    // Calculate stride and offset
    const stride = shape.attrib.getStride();
    const buffer = shape.attrib.getBuffer();
    
    // Upload data to GPU
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    
    // Set up attribute pointers
    for (let i = 0; i < shape.attrib.attributes.length; i++) {
        const attr = shape.attrib.attributes[i];
        const loc = gl.getAttribLocation(gl.program, attr.name);
        if (loc >= 0) {
            gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, stride, attr.offset);
            gl.enableVertexAttribArray(loc);
        }
    }
}

// Add this function to generate color indices from the original colors
function generateColorIndices(colorsArray) {
    // Create a map to store unique colors and their indices
    const colorMap = new Map();
    const colorIndices = [];
    let nextIndex = 0;
    
    // Process colors in groups of 3 (r,g,b)
    for (let i = 0; i < colorsArray.length; i += 3) {
        // Create a color key from the RGB values
        const colorKey = `${colorsArray[i]},${colorsArray[i+1]},${colorsArray[i+2]}`;
        
        // Check if we've seen this color before
        if (!colorMap.has(colorKey)) {
            // If not, assign it a new index
            colorMap.set(colorKey, nextIndex++);
        }
        
        // Add the color index to our result array
        colorIndices.push(colorMap.get(colorKey));
    }
    
    console.log(`Reduced ${colorsArray.length/3} colors to ${colorMap.size} unique colors`);
    
    // Return the array of color indices
    return colorIndices;
}