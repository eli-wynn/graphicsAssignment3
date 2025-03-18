#version 300 es
// ==========================================================================
// $Id: boxes.vs,v 1.2 2019/02/27 22:26:55 jlang Exp $
// Basic colored tetrahedron rendering
// ===================================================================
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
// $Log: boxes.vs,v $
// Revision 1.2  2019/02/27 22:26:55  jlang
// Complete example with element-based instanced rendering
//
// Revision 1.1  2019/02/19 22:17:06  jlang
// Intial (incomplete) boxes laboratory.
//
// Revision 1.1  2019/02/14 02:43:09  jlang
// Solution to lab 4.
//
// ==========================================================================


uniform mat4 proj_matrix;
uniform mat4 rot_matrix;

layout (location=0) in vec4 a_vertex;
layout (location=1) in vec3 a_color;

layout (location = 2) in mat4 model_matrix;	

out vec3 v_color;

void main() {
  // map the vertex position into normalized device coordinates
  gl_Position = proj_matrix * model_matrix * rot_matrix * a_vertex;
  // Pass on the color to the fragment shader
  v_color = a_color;
}
