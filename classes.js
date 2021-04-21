class Player { //all player variables
  constructor(x,y,z,p,l,d) {
    //define and store camera position
    this.x = x
    this.y = y
    this.z = z
    //define and store camera rotation
    this.xRot = 0
    this.yRot = 0
    this.zRot = 0
    this.perspective = p //perspective is used to calculate the effect of distance (z) on size of objects. smaller p is bigger effect on distance
    this.light = l //brightness of light at the center of the player.
    
    this.maxViewDis = d //blocks disappear if they are further away than this
    
    this.speed = 3
    
    this.selectedBlock = false; //stores the block the player is currently looking at
    
    this.pointerLock = false; //stores if the game is in pointerLock mode
    
    this.inventory = {maxSlots: 9, maxStackSize:99, slots:[]}
  }
  addItem(type, qty) {
    const i = this.inventory.slots.find(o => o.type === type && o.qty < this.inventory.maxStackSize);
    if (i) {
      const toAdd = Math.min(i.qty + qty, this.inventory.maxStackSize);
      const toInsert = Math.max(i.qty + qty - this.inventory.maxStackSize, 0);
  
      i.qty += toAdd-i.qty;

      if (toInsert) {
        this.inventory.slots.push({ type, qty: toInsert });
      }
    } else {
      let remaining = qty;

      while (remaining > 0) {
        const toSubtract = Math.min(remaining, this.inventory.maxStackSize);

        this.inventory.slots.push({ type, qty: toSubtract });

        remaining -= toSubtract;
      }
    }
    return void (this.inventory.slots = this.inventory.slots.slice(0, this.inventory.maxSlots));
  }
  drawInv() {
    ctx.font = "bold 16px sans-serif";
    for (let i = 0; i < this.inventory.maxSlots; i++) {
      const slot = this.inventory.slots[i];
      ctx.fillStyle = "rgb(155, 155, 155, 0.8)";
      ctx.fillRect(25 + i * 85, canvas.height - 100, 75, 75);
      if (slot) {
        ctx.fillStyle = blockTypes[slot.type].color;
        ctx.fillRect(35 + i * 85, canvas.height - 90, 55, 55);
        ctx.fillStyle = "#ff0000";
        ctx.fillText(slot.qty, 35 + i * 85, canvas.height - 30);
      }
    }
  }
}


class Cube { //cube class
  constructor(x,y,z,w,h,d,mx,my,mz,t,a) {
    this.type = t
    //set location
    this.x = x
    this.y = y
    this.z = z
    this.action = a
    //set size
    this.w = w
    this.h = h
    this.d = d
    //position in world array
    this.mx = mx
    this.my = my
    this.mz = mz
    //cube color
    this.color = blockTypes[this.type].color
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
    this.faces = [[0,1,2,3,1],
                  [4,5,6,7,2],
                  [0,3,7,4,3],
                  [0,1,5,4,4],
                  [1,2,6,5,5],
                  [2,3,7,6,6]]
  }
  //function to draw the cube
  draw(m,s) {
    ctx.lineWidth = 0.3
    if(this.mx > 0 && this.mx < worldSize-1 && this.my > 0 && this.my < worldSize-1 && this.mz > 0 && this.mz < 8) {
      if(world[this.mx-1][this.my][this.mz] == 1 && world[this.mx+1][this.my][this.mz] == 1 &&
         world[this.mx][this.my-1][this.mz] == 1 && world[this.mx][this.my+1][this.mz] == 1 &&
         world[this.mx][this.my][this.mz-1] == 1 && world[this.mx][this.my][this.mz+1] == 1) {
            return;
      }
    }
    //put the faces in the correct order for distance drawing
    this.faces = sortFaces(this.points, this.faces)

    for(let i = 3; i<this.faces.length; i++) { //draw each face inidvidually, but only the 3 closest to the camera to reduce lag
      
      // if a face is covered by another cube, do not draw it.
      if(this.faces[i][4] == 1 && this.my > 0 && world[this.mx][this.my-1][this.mz] == 1) continue;
      if(this.faces[i][4] == 2 && this.my < worldSize-1 && world[this.mx][this.my+1][this.mz] == 1) continue;
      if(this.faces[i][4] == 3 && this.mx > 0 && world[this.mx-1][this.my][this.mz] == 1) continue;
      if(this.faces[i][4] == 5 && this.mx < worldSize-1 && world[this.mx+1][this.my][this.mz] == 1) continue;
      if(this.faces[i][4] == 4 && this.mz >= 0 && world[this.mx][this.my][this.mz+1] == 1) continue;
      if(this.faces[i][4] == 6 && this.mz < worldSize-1 && world[this.mx][this.my][this.mz-1] == 1) continue;
      
        //check if the player is currently looking at this face
        let point1 = get3dto2d(this.points[this.faces[i][0]].x, this.points[this.faces[i][0]].y, this.points[this.faces[i][0]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point2 = get3dto2d(this.points[this.faces[i][1]].x, this.points[this.faces[i][1]].y, this.points[this.faces[i][1]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point3 = get3dto2d(this.points[this.faces[i][2]].x, this.points[this.faces[i][2]].y, this.points[this.faces[i][2]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point4 = get3dto2d(this.points[this.faces[i][3]].x, this.points[this.faces[i][3]].y, this.points[this.faces[i][3]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let polyPoints = [point1, point2, point3, point4]
        if(inside([xc, yc], polyPoints) && player.selectedBlock != this) {
          player.selectedBlock = this;
          i=0;
        }
      
      ctx.beginPath()
      let point3d = this.points[this.faces[i][0]]
      //transform the 3d point to a 2d point
      let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
      if(!point2d) continue;
      ctx.moveTo(point2d[0], point2d[1]) //go to the location of the first point
      for(let j = 1; j<this.faces[i].length-1; j++) { //draw a line to each point of the current face
        let point3d = this.points[this.faces[i][j]]
        //transform the 3d point to a 2d point
        let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        if(!point2d) {ctx.beginPath(); break;};
        ctx.lineTo(point2d[0], point2d[1])
      }
      ctx.closePath() //finish at the line off at its start
      let gradient = ctx.createRadialGradient(window.innerWidth/2,window.innerHeight/2,30,window.innerWidth/2,window.innerHeight/2,750);
      gradient.addColorStop(0.1,ColorLuminance(this.color, player.light))
      gradient.addColorStop(1,this.color)
      ctx.fillStyle = gradient
      if(!m && player.selectedBlock == this) {
        ctx.fillStyle = ColorLuminance(this.color, 1)
      }
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