// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform vec3 u_LightDirection;
    uniform vec3 u_LightColor;
    uniform vec3 u_AmbientLight;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        
        // Use color based on position for testing
        // This creates different colors for different parts of the model
        vec3 baseColor = normalize(abs(a_Position.xyz)) * 0.8 + 0.2;
        
        // Calculate the world coordinate
        vec4 worldPosition = u_ModelMatrix * a_Position;
        
        // Calculate the normal direction
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        
        // Calculate the light direction and make it 1.0 in length
        vec3 lightDirection = normalize(u_LightDirection);
        
        // The dot product of the light direction and the normal
        float nDotL = max(dot(normal, lightDirection), 0.0);
        
        // Calculate the color due to diffuse reflection
        vec3 diffuse = u_LightColor * baseColor * nDotL;
        
        // Calculate the color due to ambient reflection
        vec3 ambient = u_AmbientLight * baseColor;
        
        // Calculate view direction for specular highlight
        vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0) - vec3(worldPosition));
        
        // Calculate half-vector for Blinn-Phong
        vec3 halfVector = normalize(lightDirection + viewDirection);
        
        // Calculate specular reflection
        float shininess = 32.0;
        float specularStrength = 0.3;
        float spec = pow(max(dot(normal, halfVector), 0.0), shininess);
        vec3 specular = specularStrength * spec * u_LightColor;
        
        // Add all lighting components
        v_Color = vec4(ambient + diffuse + specular, 1.0);
    }
`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

// Function to initialize shaders
function setupShaders(gl) {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders.');
        return false;
    }
    return true;
}