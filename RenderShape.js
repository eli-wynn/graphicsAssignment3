// ==========================================================================
// $Id: RenderShape.js,v 1.2 2019/02/27 03:10:37 jlang Exp $
// RenderShape as a parent for shape objects 
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
// $Log: RenderShape.js,v $
// Revision 1.2  2019/02/27 03:10:37  jlang
// Element-based drawing
//
// Revision 1.1  2019/02/19 22:17:06  jlang
// Intial (incomplete) boxes laboratory.
//
// ==========================================================================

function RenderShape(attributes) {
    this.attrib = attributes;
    this.vertex = null;
    this.index = null;
    this.hasIndex = false;
    this.vertex_direct = null;
    this.hasVertexUnrolled = false;
    // to be extended
}


