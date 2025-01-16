'use strict';

class Shape {

    constructor(x, y, size, color, vertices){
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vertices = new Float32Array(vertices);
    }
    
    /**
     * Creates and draws buffer of points
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {Number} drawType Primitive type to pass to drawArrays
     * @param {Number} n Number of vertices per primative
     * @param {GLint} a_Position Attribute that positions primitive
     * @param {WebGLUniformLocation} u_FragColor Uniform that determines color of primitive
     */
    render(gl, drawType, n, a_Position, u_FragColor){

        gl.uniform4f(u_FragColor, ...this.color);

        var vertBuffer = gl.createBuffer();
        if(!vertBuffer){
            throw new Error('Could not create buffer!');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(drawType, 0, n);
    }
}

class Point extends Shape {

    constructor(x, y, size, color){
        super(x, y, size, color, [x, y]);
    }
    
    /**
     * Renders a point
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {GLint} a_Position Position attribute
     * @param {GLint} a_Size Size attribute for points only
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     */
    render(gl, a_Position, a_Size, u_FragColor){
        gl.vertexAttrib1f(a_Size, this.size);
        super.render(gl, gl.POINTS, 1, a_Position, u_FragColor);
    }
}

class Triangle extends Shape {

    baseVertices = [0, 0.5, -1, -0.5, 1, -0.5];

    constructor(x, y, size, color){
        super(x, y, size, color, []);
        
        this.vertices = this.baseVertices;
        for (var i = 0; i < 6; i += 2){
            this.vertices[i] *= this.size * 0.01;
            this.vertices[i] += this.x;

            this.vertices[i + 1] *= this.size * 0.01;
            this.vertices[i + 1] += this.y;
        }
        this.vertices = new Float32Array(this.vertices);
    }

    /**
     * Renders a triangle
     * @param {WebGLRenderingContext} gl 
     * @param {GLint} a_Position 
     * @param {WebGLUniformLocation} u_FragColor 
     */
    render(gl, a_Position, u_FragColor){
        super.render(gl, gl.TRIANGLES, 3, a_Position, u_FragColor);
    }
}

class Circle extends Shape {
    constructor(x, y, size, color, segments){
        super(x, y, size, color, []);
        this.vertices = [this.x, this.y];
        for (var i = 0; i < segments + 1; i++){
            this.vertices.push(Math.cos(2 * Math.PI / segments * i) * 0.01 * this.size + this.x);
            this.vertices.push(Math.sin(2 * Math.PI / segments * i) * 0.01 * this.size + this.y);
        }
        this.vertices = new Float32Array(this.vertices);
    }

    /**
     * Renders a triangle
     * @param {WebGLRenderingContext} gl 
     * @param {GLint} a_Position 
     * @param {WebGLUniformLocation} u_FragColor 
     */
    render(gl, a_Position, u_FragColor){
        super.render(gl, gl.TRIANGLE_FAN, this.vertices.length / 2, a_Position, u_FragColor);
    }
}

class Polygon extends Shape {
    constructor(color, vertices, drawType){
        super(0, 0, 0, color, vertices);
        this.drawType = drawType;
    }

    /**
     * Renders a triangle
     * @param {WebGLRenderingContext} gl 
     * @param {GLint} a_Position 
     * @param {WebGLUniformLocation} u_FragColor 
     */
    render(gl, a_Position, u_FragColor){
        super.render(gl, this.drawType, this.vertices.length / 2, a_Position, u_FragColor);
    }
}