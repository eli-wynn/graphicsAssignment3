// ==========================================================================
// $Id: Attributes.js,v 1.3 2019/02/27 22:26:52 jlang Exp $
// Attributes class to be used for shapes to create Float32Arrays 
// ==========================================================================
// (C)opyright:
//
//   Jochen Lang
//   EECS, University of Ottawa
//   800 King Edward Ave.
//   Ottawa, On., K1N 6N5
//   Canada.
//   http://www.eecs.uottawa.ca
//
// Creator: jlang (Jochen Lang)
// Email:   jlang@eecs.uottawa.ca
// ==========================================================================
// $Log: Attributes.js,v $
// Revision 1.3  2019/02/27 22:26:52  jlang
// Complete example with element-based instanced rendering
//
// Revision 1.2  2019/02/27 03:10:37  jlang
// Element-based drawing
//
// Revision 1.1  2019/02/19 22:17:06  jlang
// Intial (incomplete) boxes laboratory.
//
// Revision 1.2  2019/02/14 0
// ==========================================================================

// Constructor
function Attributes(nColors,nTfms, ... minmax) { 
  this._minP = glMatrix.vec3.fromValues(-1.0,-1.0,-1.0);
  this._maxP = glMatrix.vec3.fromValues(1.0,1.0,1.0);	
  if ( minmax.length >= 1 ) {
	  if ( minmax[0] instanceof Float32Array ) {
		glMatrix.vec3.copy(this._minP, minmax[0]);
	  }
	  if ( minmax.length >= 2 && minmax[1] instanceof Float32Array ) {
		glMatrix.vec3.copy(this._maxP, minmax[1]);
	  }
  }
  this.colors = null; 
  this.tfms = null;
  this.updateColors(nColors);
  this.updateTransforms(nTfms);
}


// Call to change colors
Attributes.prototype.updateColors = function( nColors ) {
  // create a jet color map
  this.colors = new Float32Array(3*nColors);  	

  let step = nColors/4;
  if ( nColors%8 != 0 ) {
      step = 2*Math.ceil(nColors/8.0);
  }
  let step2 = step/2;


  for (let i = 0; i < step2; i++ ) {
    this.colors[3*i] = 0.0;
    this.colors[3*i+1] = 0.0;
    this.colors[3*i+2] = 0.5 + (i*0.5)/step2;
  }
  for (let i = step2; i < step+step2; i++ ) {
    this.colors[3*i] = 0.0;
    this.colors[3*i+1] = (i-step2)/step;
    this.colors[3*i+2] = 1.0;
  }
  for (let i = step+step2; i<2*step+step2; i++ ) {
    this.colors[3*i] = (i-step-step2)/step;
    this.colors[3*i+1] = 1.0;
    this.colors[3*i+2] = (2.0*step+step2-i)/step;
  }
  for (let i = 2*step+step2; i<3*step+step2; i++ ) {
    this.colors[3*i] = 1.0;
    this.colors[3*i+1] = (3.0*step+step2-i)/step;
    this.colors[3*i+2] = 0.0;
  }
  for (let i = 3*step+step2; i<nColors; i++ ) {
    this.colors[3*i] = (nColors-i)/step + 0.5;
    this.colors[3*i+1] = 0.0;
    this.colors[3*i+2] = 0.0;
  }
  return;
}

// Call to change viewing volume
// minmax must be two Float32Array as created by gl.Matrix.vec3 
// specifying the minimum and maximum of the volume
Attributes.prototype.updateTransforms = function( nTfms, ... minmax) { 
  if ( minmax.length >= 1 ) {
	  if ( minmax[0] instanceof Float32Array ) {
		glMatrix.vec3.copy(this._minP, minmax[0]);
	  }
	  if ( minmax.length >= 2 && minmax[1] instanceof Float32Array ) {
		glMatrix.vec3.copy(this._maxP, minmax[1]);
	  }
  }
  if ( this.tfms == null || nTfms != this.tfms.length / 16 ) {
	this.tfms = new Float32Array(16*nTfms);
  }
  let volume = glMatrix.vec3.create();
  glMatrix.vec3.subtract(volume,this._maxP,this._minP);
  let randVec = glMatrix.vec3.create();
  var len2 = 0.0;
  let m4 = glMatrix.mat4.create();
  for (let i=0; i<nTfms; i++) {
    // make a unit vector
    do {
      glMatrix.vec3.set(randVec, 2.0*Math.random()-1.0,
			2.0*Math.random()-1.0,
			2.0*Math.random()-1.0);
      len2 = glMatrix.vec3.sqrLen(randVec); 
    } while ( len2 > 1.0 );
    // Now normalize
    glMatrix.vec3.scale( randVec, randVec, 1.0/Math.sqrt(len2));
    // random angle -pi .. pi
    let angle = Math.PI * ( 2.0 * Math.random() -  1.0 );
    // Set the rotation matrix
      glMatrix.mat4.fromRotation(m4, angle, randVec );
    // Add a random vector scaled upto the viewing volume
    randVec[0] = (Math.random()-0.5) * volume[0];
    randVec[1] = (Math.random()-0.5) * volume[1];
    randVec[2] = (Math.random()-0.5) * volume[2];
    glMatrix.mat4.translate( m4, m4, randVec );
	// Copy the matrix into the float buffer for transforms
	for ( let j=0; j<16; j++) {
	  this.tfms[i*16+j] = m4[j];
	}
  }
  return;
}

// ==========================================================================
// Attributes class for managing vertex attributes
// ==========================================================================

function Attributes() {
    this.attributes = [];
    this.stride = 0;
}

Attributes.prototype.addAttribute = function(name, data, size) {
    const attribute = {
        name: name,
        data: data,
        size: size,
        offset: this.stride
    };
    
    this.attributes.push(attribute);
    this.stride += size * 4; // 4 bytes per float
};

Attributes.prototype.getStride = function() {
    return this.stride;
};

Attributes.prototype.getBuffer = function() {
    // Calculate total buffer size
    let totalSize = 0;
    const numVertices = this.attributes[0].data.length / this.attributes[0].size;
    
    for (let i = 0; i < this.attributes.length; i++) {
        totalSize += this.attributes[i].size * numVertices;
    }
    
    // Create buffer
    const buffer = new Float32Array(totalSize);
    
    // Fill buffer
    let offset = 0;
    for (let vertex = 0; vertex < numVertices; vertex++) {
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            for (let j = 0; j < attr.size; j++) {
                buffer[offset++] = attr.data[vertex * attr.size + j];
            }
        }
    }
    
    return buffer;
};
