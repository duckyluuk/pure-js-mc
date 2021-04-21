var canvas = document.getElementById("draw")
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
var camera;
var ctx = document.getElementById("draw").getContext("2d");
class Camera { //camera, not used yet
  constructor(x,y,z,p) {
    //define and store camera position
    this.x = x
    this.y = y
    this.z = z
    //define and store camera rotation
    this.xRot = 0
    this.yRot = 0
    this.zRot = 0
    this.perspective = p //perspective is used to calculate the effect of distance (z) on size of objects. smaller p is bigger effect on distance
  }
}

//grid offset starts at center of screen
var xc = window.innerWidth / 2
var yc = window.innerHeight / 2

var objects = []
var keysDown = {} //stores clicked keyboard keys

window.onload = function(e) {
  
  camera = new Camera(0,0,-250, 1000)
  /*objects.push(new Cube(50,0,50,50,50,50,"#0000ff"))
  objects.push(new Cube(-100,-25,-50,50,50,50,"#00ff00", function(o) {rotate(o, 0.01, 0.01, 0.01)}))
  objects.push(new Cube(150, 50, -50, 25, 25, 25, "#000000"))
  objects.push(new Pyramid(150, 25, -50, 25, 25, 25, "#000000"))
  objects.push(new Cube(150, 50, -1000, 25, 25, 25, "#000000"))*/
  
  for(let i=0; i<16; i++) {
    for(let j=0; j<16; j++) {
      let rand = Math.ceil(Math.random()*3)
      for(let k=-2; k<rand+3; k++) {
        if(k<rand) {
          objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, "#555555"))
        } else if(k<rand+2) {
          objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, "#885511"))
        } else objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, "#009900"))
      }
    }
  }
  update()
  
}


function update() { //update the screen
  // reset screen
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight)
  
  // KEY HANDLER
  //move cube
  if(keysDown[87]) { //w key
    camera.x += -3 * Math.sin(camera.yRot)
    camera.z +=  3 * Math.cos(camera.yRot)
    
  }
  if(keysDown[65]) { //a key
    camera.x -=  3 * Math.cos(camera.yRot)
    camera.z -=  3 * Math.sin(camera.yRot)
  }
  if(keysDown[83]) { //s key
    camera.x -= -3 * Math.sin(camera.yRot)
    camera.z -=  3 * Math.cos(camera.yRot)
  }
  if(keysDown[68]) { //d key
    camera.x +=  3 * Math.cos(camera.yRot)
    camera.z +=  3 * Math.sin(camera.yRot)
  }
  if(keysDown[16]) { //shift key
    camera.y += 3
  }
  if(keysDown[32]) { //space key
    camera.y -= 3
  }
  //move camera
  if(keysDown[37]) { //left arrow
    camera.yRot += 0.01
    if(camera.yRot >= 2*Math.PI) camera.yRot -= 2*Math.PI
  }
  if(keysDown[39]) { //right arrow
    camera.yRot -= 0.01
    if(camera.yRot <= -2*Math.PI) camera.yRot += 2*Math.PI
  }
  if(keysDown[38]) { //up arrow
    if(camera.xRot < 0.5*Math.PI) {
      camera.xRot += 0.01
    }
  }
  if(keysDown[40]) { //down arrow
    if(camera.xRot > -0.5*Math.PI) {
      camera.xRot -= 0.01
    }
  
  }
  //sort objects in the correct drawing order
  objects.sort(sortObjOrder)
  
  //draw the cubes
  for(let i = 0; i < objects.length; i++) {
    if(objects[i].action) {
      objects[i].action(objects[i])
    }
    objects[i].draw()
  }
  
  //rerun the loop
  requestAnimationFrame(update)
}

//function to rotate an object
function rotate(o, x, y, z) {
  o.rotatex(x)
  o.rotatey(y)
  o.rotatez(z)
}



function get3dto2d(x,y,z) { //get a 2d point on a canvas out of a point in 3d space
  //move the object to the camera, so the rotation works as it should
  let xTemp= x- camera.x
  let yTemp= y- camera.y
  let zTemp= z- camera.z
  
  //take camera rotation into consideration
  let nx =  xTemp * Math.cos(camera.yRot) + zTemp * Math.sin(camera.yRot)
  let ny =  yTemp
  let nz = -xTemp * Math.sin(camera.yRot) + zTemp * Math.cos(camera.yRot)
  
  nx =  nx
  ny =  ny * Math.cos(camera.xRot) + nz * Math.sin(camera.xRot)
  nz = -yTemp * Math.sin(camera.xRot) + nz * Math.cos(camera.xRot)
  
  //move it back to its original position
  x = nx+ camera.x
  y = ny+ camera.y
  z = nz+ camera.z
  
  //do not draw it if it is behind the camera
  if(z < camera.z ) return false;
  
  //do some math to convert the rotated 3d point into a 2d point
  let updateX = (x-camera.x) / ((z-camera.z)/camera.perspective)
  let updateY = (y-camera.y) / ((z-camera.z)/camera.perspective)

  //0,0,0 is at the center of the start screen
  updateX += xc
  updateY += yc
  
  return [updateX, updateY]
}



window.addEventListener("keydown", function(e) { //when keys are pressed add them to the list of pressed keys
  keysDown[e.keyCode] = true;
})

window.addEventListener("keyup", function(e) { //when keys are released remove them from the list of pressed keys
  keysDown[e.keyCode] = false;
})

class Cube { //cube class
  constructor(x,y,z,w,h,d,c,a) {
    //set location
    this.x = x
    this.y = y
    this.z = z
    this.action = a
    //set size
    this.w = w
    this.h = h
    this.d = d
    //cube color
    this.color = c
    //all of the cube's points
    this.points = [
      {x: x, y: y, z: z},
      {x: x+w, y: y, z: z},
      {x: x+w, y: y+h, z: z},
      {x: x, y: y+h, z: z},
      
      {x: x, y: y, z: z+d},
      {x: x+w, y: y, z: z+d},
      {x: x+w, y: y+h, z: z+d},
      {x: x, y: y+h, z: z+d}
    ]
    //all of the cube faces, using the points above
    this.faces = [[0,1,2,3],
                  [4,5,6,7],
                  [0,3,7,4],
                  [0,1,5,4],
                  [1,2,6,5],
                  [2,3,7,6]]
  }
  //function to draw the cube
  draw() {
    //put the faces in the correct order for distance drawing
    this.faces = sortFaces(this.points, this.faces)
    
    for(let i = 3; i<this.faces.length; i++) { //draw each face inidvidually, but only the 3 closest to the camera to reduce lag
      ctx.beginPath()
      let point3d = this.points[this.faces[i][0]]
      //transform the 3d point to a 2d point
      let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
      if(!point2d) return;
      
      ctx.moveTo(point2d[0], point2d[1]) //go to the location of the first point
      for(let j = 1; j<this.faces[i].length; j++) { //draw a line to each point of the current face
        let point3d = this.points[this.faces[i][j]]
        //transform the 3d point to a 2d point
        let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        if(!point2d) return;
        
        ctx.lineTo(point2d[0], point2d[1])
      }
      ctx.lineTo(point2d[0],point2d[1]) //finish at the line off at its start
      ctx.fillStyle = this.color
      ctx.fill() //actually draw the lines
      ctx.strokeStyle = "#000000"
      ctx.stroke() //draw the lines around the face
    }
  }
  //function to move the cube
  move(dx,dy,dz) {
    //update cube position
    this.x += dx
    this.y += dy
    this.z += dz
    
    //update individual points
    for(let i = 0; i<this.points.length; i++) {
      this.points[i].x += dx
      this.points[i].y += dy
      this.points[i].z += dz
    }
  }
  //function to rotate the cube around its x axis
  rotatex(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dy = this.points[i].y - (this.y + this.h/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let ny = dy * Math.cos(a) - dz * Math.sin(a)
      let nz = dy * Math.sin(a) + dz * Math.cos(a)
      this.points[i].y = ny + (this.y + this.h/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the cube around its y axis
  rotatey(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let nx = dx * Math.cos(a) - dz * Math.sin(a)
      let nz = dx * Math.sin(a) + dz * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the cube around its z axis
  rotatez(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dy = this.points[i].y - (this.y + this.h/2)
      let nx = dx * Math.cos(a) - dy * Math.sin(a)
      let ny = dx * Math.sin(a) + dy * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].y = ny + (this.y + this.h/2)
    }
  }
}

class Pyramid { //pyramid class
  constructor(x,y,z,w,h,d,c) {
    //set location
    this.x = x
    this.y = y
    this.z = z
    
    //set size
    this.w = w
    this.h = h
    this.d = d
    //pyramid color
    this.color = c
    //all of the pyramid's points
    this.points = [
      {x: x, y: y+h, z: z},
      {x: x+w, y: y+h, z: z},
      {x: x+w, y: y+h, z: z+d},
      {x: x, y: y+h, z: z+d},
      {x: x+0.5*w, y: y, z: z+0.5*d}
    ]
    //all of the pyramid's faces, using the points above
    this.faces = [[0,1,2,3],
                  [0,1,4],
                  [1,2,4],
                  [2,3,4],
                  [3,0,4]]
  }
  //function to draw the pyramid
  draw() {
    //put the faces in the correct order for distance drawing
    this.faces = sortFaces(this.points, this.faces)
    
    for(let i = 0; i<this.faces.length; i++) { //draw each face inidvidually
      ctx.beginPath()
      let point3d = this.points[this.faces[i][0]]
      //transform the 3d point to a 2d point
      let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
      if(!point2d) return;
      
      ctx.moveTo(point2d[0], point2d[1]) //go to the location of the first point
      for(let j = 1; j<this.faces[i].length; j++) { //draw a line to each point of the current face
        let point3d = this.points[this.faces[i][j]]
        //transform the 3d point to a 2d point
        let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        if(!point2d) return;
        
        ctx.lineTo(point2d[0], point2d[1])
      }
      ctx.lineTo(point2d[0],point2d[1]) //finish at the line off at its start
      ctx.fillStyle = this.color
      ctx.fill() //fill in the face
      ctx.strokeStyle = "#000000"
      ctx.stroke() //draw the lines around the face
    }
  }
  //function to move the pyramid
  move(dx,dy,dz) {
    //update pyramid position
    this.x += dx
    this.y += dy
    this.z += dz
    
    //update individual points
    for(let i = 0; i<this.points.length; i++) {
      this.points[i].x += dx
      this.points[i].y += dy
      this.points[i].z += dz
    }
  }
  //function to rotate the pyramid around its x axis
  rotatex(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dy = this.points[i].y - (this.y + this.h/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let ny = dy * Math.cos(a) - dz * Math.sin(a)
      let nz = dy * Math.sin(a) + dz * Math.cos(a)
      this.points[i].y = ny + (this.y + this.h/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the pyramid around its y axis
  rotatey(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let nx = dx * Math.cos(a) - dz * Math.sin(a)
      let nz = dx * Math.sin(a) + dz * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the pyramid around its z axis
  rotatez(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dy = this.points[i].y - (this.y + this.h/2)
      let nx = dx * Math.cos(a) - dy * Math.sin(a)
      let ny = dx * Math.sin(a) + dy * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].y = ny + (this.y + this.h/2)
    }
  }
}

function sortObjOrder(a, b) {
  let avgXA = 0; let avgYA = 0; let avgZA = 0 //starting variables to find the sum of all values
  
  for(var i = 0; i < a.points.length; i++) { //add each value
    avgXA += a.points[i].x
    avgYA += a.points[i].y
    avgZA += a.points[i].z
  }
  //divide total value by amount of points to get average
  avgXA /= i
  avgYA /= i
  avgZA /= i
  
  let avgXB = 0; let avgYB = 0; let avgZB = 0 //starting variables to find the sum of all values
  
  for(var j = 0; j < b.points.length; j++) { //add each value
    avgXB += b.points[j].x
    avgYB += b.points[j].y
    avgZB += b.points[j].z
  }  
  //divide total value by amount of points to get average
  avgXB /= j
  avgYB /= j
  avgZB /= j  
  
  //substract camera position from all points to get the difference
  let xDisA = Math.abs(avgXA - camera.x)
  let yDisA = Math.abs(avgYA - camera.y)
  let zDisA = Math.abs(avgZA - camera.z)
  
  let xDisB = Math.abs(avgXB - camera.x)
  let yDisB = Math.abs(avgYB - camera.y)
  let zDisB = Math.abs(avgZB - camera.z)
  
  //put the furthest item first in the array, so that gets drawn first and thus behind objects that are closer to the camera.
  if(xDisA + yDisA + zDisA > xDisB + yDisB + zDisB) {
    return -1;
  }
  if(xDisA + yDisA + zDisA < xDisB + yDisB + zDisB) {
    return 1;
  }
  
  return 0;
}

function sortFaces(points, faces) {
  
  faces.sort(function (a, b) {
    let avgXA = 0; let avgYA = 0; let avgZA = 0;
    for(var i=0; i<a.length;i++) {
      avgXA += points[a[i]].x
      avgYA += points[a[i]].y
      avgZA += points[a[i]].z
    }
    
    avgXA /= i
    avgYA /= i
    avgZA /= i
    
    let avgXB = 0; let avgYB = 0; let avgZB = 0;
    for(var j=0; j<b.length;j++) {
      avgXB += points[b[j]].x
      avgYB += points[b[j]].y
      avgZB += points[b[j]].z
    }
    avgXB /= j
    avgYB /= j
    avgZB /= j
    
    //substract camera position from all points to get the difference
    let xDisA = Math.abs(avgXA - camera.x)
    let yDisA = Math.abs(avgYA - camera.y)
    let zDisA = Math.abs(avgZA - camera.z)

    let xDisB = Math.abs(avgXB - camera.x)
    let yDisB = Math.abs(avgYB - camera.y)
    let zDisB = Math.abs(avgZB - camera.z)
    
    //put the furthest item first in the array, so that gets drawn first and thus behind objects that are closer to the camera.
    if(xDisA + yDisA + zDisA > xDisB + yDisB + zDisB) {
      return -1;
    }
    if(xDisA + yDisA + zDisA < xDisB + yDisB + zDisB) {
      return 1;
    }

    return 0;    
  })
  
  return faces;
}