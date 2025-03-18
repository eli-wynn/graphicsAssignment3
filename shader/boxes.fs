#version 300 es
// ==========================================================================
// $Id: boxes.fs,v 1.2 2019/02/27 03:10:37 jlang Exp $
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
// $Log: boxes.fs,v $
// Revision 1.2  2019/02/27 03:10:37  jlang
// Element-based drawing
//
// Revision 1.1  2019/02/19 22:17:06  jlang
// Intial (incomplete) boxes laboratory.
//
// Revision 1.1  2019/02/14 02:43:09  jlang
// Solution to lab 4.
//
// ==========================================================================


#ifdef GL_ES
  precision mediump float;
#endif


in vec3 v_color;
out vec4 frag_color;

void main() {
  // Pass on the fragment color to the frame buffer
  frag_color = vec4(v_color,1.0);
}
