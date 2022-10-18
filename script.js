window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");// a fixed size drawing space.
  const ctx = canvas.getContext("2d");//obtains rendering context in 2d 
  canvas.width = 1000;
  canvas.height = 500;

  class InputHandler {
    //functional keys of the game
    //keeps track of user inputs(arrow keys)
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (e) => {//event that occours while the key is pressed
        if (
          (e.key === "ArrowUp" || e.key === "ArrowDown") &&
          this.game.keys.indexOf(e.key) === -1 
          //when an arrow key is pressed and its not already present in the array of pressed keys
        ) {
          this.game.keys.push(e.key); //push it to the array 
        } else if (e.key === " ") { //when space bar is pressed ,shoot
          this.game.player.shootTop();
        } else if (e.key === "d") {//debug mode is activated upon pressing the letter 'd'
          this.game.debug = !this.game.debug;
        }
      });
      window.addEventListener("keyup", (e) => {//when no key is pressed remove elements from the array of pressed keys so that the 
        //player does not keep moving continuously
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(e.key, 1);
        }
      });
    }
  }
  class projectile {
    //handle lasers

    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      //dimensions of the projectiles
      this.width = 10;
      this.height = 3;
      this.speed = 3;//speed of projectile
      this.markedForDeletion = false;
      this.image = document.getElementById("projectile");
    }
    update() {
      this.x += this.speed;//keeps updating the position(x axis position) of the projectile continuously
      if (this.x > this.game.width * 0.8) //if the projectile crosses the boundary of the canvas remove it
      this.markedForDeletion = true;
    }
    draw(context) {//draws the projectile
      context.drawImage(this.image, this.x, this.y);
    }
  }
  class particle {
    //handles the falling bolts ,particles around the enemy 
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById("gears");
      this.frameX = Math.floor(Math.random() * 3);//randomly spills the particles around
      this.frameY = Math.floor(Math.random() * 3);
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);//size of particles in the sprite sheet
      this.size = this.spriteSize * this.sizeModifier;
      this.speedX = Math.random() * 6 - 3;//speed of the particles are randomly adjusted
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markedForDeletion = false;
      this.angle = 0;
      this.va = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      this.bottombounce = Math.random() * 80 + 60;//number of bounces before the particles fall off
    }
    update() {
      //updates the position of the particles relative to the speed and dimensions of the enemy.
      this.angle += this.va;
      this.speedY += this.gravity;
      this.x -= this.speedX + this.game.speed;
      this.y += this.speedY;
      if (this.y > this.game.height + this.size || this.x <= 0 - this.size)
        this.markedForDeletion = true;
      if (this.y > this.game.height - this.bottombounce && this.bounced < 2) { //bounces the particles 2 times before it falls out
        this.bounced++;
        this.speedY *= -0.7;
      }
    }
    draw(context) {
      //takes care of the appearance of the particles
      context.save(); //takes hold of current canvas state(this is used because the particles exist only for a certain interval of time)
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.spriteSize,
        this.frameY * this.spriteSize,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();//restores the most recently drawn state 
    }
  }
  class Player {
    //handles the player 
    constructor(game) {
      this.game = game;
      //dimensions of the player
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 100;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
      this.image = document.getElementById("player");
      //power up mode of the player 
      this.powerUp = false;
      this.powerUpTimer = 0;
      this.powerUpLimit = 10000;
    }
    update(deltaTime) {
      //the pressed keys are pushed into an array(keys) 
      if (this.game.keys.includes("ArrowUp")) //up arrow is pressed 
      this.speedY = -this.maxSpeed;
      else if (this.game.keys.includes("ArrowDown"))//down arrow is pressed 
        this.speedY = this.maxSpeed;
      else 
        this.speedY = 0;//no key is pressed
      this.y += this.speedY;
      //handle boundaries (to keep player inside the canvas dimensions)
      if (this.y > this.game.height - this.height * 0.5)
        this.y = this.game.height - this.height * 0.5;
      else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;
      //handle projectiles 
      this.projectiles.forEach((projectile) => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
      //handles animation
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
      //handles power up
      if (this.powerUp) {//when the player enters the power up mode
        if (this.powerUpTimer > this.powerUpLimit) { 
          this.powerUpTimer = 0;
          this.powerUp = false;
          this.frameY = 0;
        } else {
          this.powerUpTimer += deltaTime;
          this.frameY = 1;
          this.game.ammo += 0.1;
        }
      }
    }
    //draws the player character with given dimensions and conditions
    draw(context) { 
      if (this.game.debug)
        context.strokeRect(this.x, this.y, this.width, this.height);
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
    shootTop() {//to shoot form the top of the player
      if (this.game.ammo > 0) { //when there is enough ammo a new projectile is created 
        this.projectiles.push(
          new projectile(this.game, this.x + 80, this.y + 30)
        );
        this.game.ammo--;//reduce the ammo 
      }
      if (this.powerUp) this.shootBottom();//when the player enters powerUp mode ,they can shoot from both top and bottom 
    }
    shootBottom() {//to shoot form bottom of the player
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new projectile(this.game, this.x + 80, this.y + 175)
        );
      }
    }
    enterPowerUp() {//player enters the power up mode
      this.powerUpTimer = 0;
      this.powerUp = true;
      if (this.game.ammo < this.game.maxammo)
        this.game.ammo = this.game.maxammo;
    }
  }
  class Enemy {
    //types of enemies
    constructor(game) {

      this.game = game;
      //initial dimensions and speed of the enemy
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;

      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
    }
    update() { //updates the enemy position (moves towards the left of the game )
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;//when it crosses the boundary ,delete it
      //animation 
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
    }
    draw(context) {//draws the enemy  
      if (this.game.debug)
        context.strokeRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
      if (this.game.debug) {//in debug mode ,details of the remaining lives of the enemy is displayed
        context.font = "20px Helvetica";
        context.fillText(this.lives, this.x, this.y);
      }
    }
  }
  //we have different types of enemies in our game ,they are all implemented as  child classes of the parent enemy class
  class Angler1 extends Enemy {
    constructor(game) {
      //dimensions of Angler1 enemy
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("angler1");
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 5;//lives of the enemy
      this.score = this.lives;//score that will be obtained on defeating the enemy
    }
  }
  class Angler2 extends Enemy {
    constructor(game) {
      //dimensions of Angler2 enemy
      super(game);
      this.width = 213;
      this.height = 165;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("angler2");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 6;//lives of the enemy
      this.score = this.lives;//score that will be obtained on defeating the enemy
    }
  }
  class LuckyFish extends Enemy {
    constructor(game) {
      //dimensions of LuckyFish enemy
      super(game);
      this.width = 99;
      this.height = 95;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("lucky");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 5;//lives of the enemy
      this.score = 15;//score that will be obtained on defeating the enemy
      this.type = "lucky";
    }
  }
  class HiveWhale extends Enemy {
    constructor(game) {
      //dimensions of HiveWhale enemy
      super(game);
      this.width = 400;
      this.height = 227;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("HiveWhale");
      this.frameY = 0;
      this.lives = 20;//lives of the enemy
      this.score = this.lives;//score that will be obtained on defeating the enemy
      this.speedX=Math.random()*-1.2-0.2;//speed of the enemy
      this.type = "hive";
    }
  }
  class Drone extends Enemy {
    constructor(game,x,y) {
      //dimensions of HiveWhale enemy
      super(game);
      this.width = 115;
      this.height = 95;
      this.x=x;
      this.y=y;
    //  this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("drone");
      this.frameY = Math.floor(Math.random()*2);
      this.lives = 3;//lives of the enemy
      this.score = this.lives;//score that will be obtained on defeating the enemy
      this.speedX=Math.random()*-4.2-0.5;//speed of the enemy
      this.type = "drone";
    }
  }


  class Layer {
    //handles the background layers 
    constructor(game, image, speedModifier) {
      this.game = game;
      this.image = image;
      this.speedModifier = speedModifier;
      this.width = 1768;
      this.height = 500;
      this.x = 0;
      this.y = 0;
    }
    update() {//updates the position of the layers 

      if (this.x <= -this.width) this.x = 0;

      this.x -= this.game.speed * this.speedModifier;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width, this.y);
    }
  }
  class Background {
    //bringing all the layer obj's together
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById("layer1");
      this.image2 = document.getElementById("layer2");
      this.image3 = document.getElementById("layer3");
      this.image4 = document.getElementById("layer4");
      this.layer1 = new Layer(this.game, this.image1, 0.2);
      this.layer2 = new Layer(this.game, this.image2, 0.4);
      this.layer3 = new Layer(this.game, this.image3, 1);
      this.layer4 = new Layer(this.game, this.image4, 1.5);
      this.layers = [this.layer1, this.layer2, this.layer3];//all the layers are then collected in an array
    }
    update() {//updates the layer with their respective speed's
      this.layers.forEach((layer) => layer.update());
    }
    draw(context) {
      this.layers.forEach((layer) => layer.draw(context));
    }
  }
  
  class Explosion{
    //handles explosion animations
    constructor(game,x,y){
      //dimensions of the explosion images
      this.game=game;
      this.x=x;
      this.y=y;
      this.frameX=0;
      this.spriteHeight=200;
      this.fps=30;
      this.timer=0;
      this.interval=1000/this.fps;
      this.markedForDeletion=false;
this.maxFrame=8;
    }
    update(deltaTime){//updates the explosion animations based on speed of the game
      this.x-=this.game.speed;
      if(this.timer>this.interval){
        this.frameX++;
        this.timer=0;
      }else{
        this.timer+=deltaTime;
      }
this.frameX++;
if(this.frameX>this.maxFrame)
this.markedForDeletion=true;
    }
    draw(context){
context.drawImage(this.image,this.frameX*this.spriteWidth,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height);
    }
  }
  class smokeExplosion extends Explosion{//smoke explosion is a type of explosion ,it's the child class of explosion class
    constructor(game,x,y){
      super(game,x,y);
this.image=document.getElementById('smokeExplosion');
//dimensions of the explosions
this.spriteWidth=200;
this.width=this.spriteWidth;
this.height=this.spriteHeight;
this.x=x-this.width*0.5;
this.y=y-this.height*0.5;
    }
  }
  class FireExplosion extends Explosion{//Fire explosion is a type of explosion ,it's the child class of explosion class
    constructor(game,x,y){
      super(game,x,y);
this.image=document.getElementById('FireExplosion');
//dimensions of the fire 
this.spriteWidth=200;
this.width=this.spriteWidth;
this.height=this.spriteHeight;
this.x=x-this.width*0.5;
this.y=y-this.height*0.5;}
  }
  class Ui { //handles the user interface of the game(score,timer,ammo,messages)
    
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Bangers";
      this.color = "white";
    }
    draw(context) {
      context.save();//saves the current state
      //styling
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";

      context.font = this.fontSize + "px " + this.fontFamily;
      //score
      context.fillText("Score: " + this.game.score, 20, 40);

      //timer
      const format = (this.game.gameTime * 0.001).toFixed(1);
      context.fillText("Timer :" + format, 20, 100);
      //game over messages
      if (this.game.gameOver) {
        context.textAlign = "center";
        let message1;
        let message2;
        if (this.game.score >= this.game.winningScore) {//if the required score is reached ,we win
          message1 = "Most Wondrous!";
          message2 = "Well done explorer!";
        } else {
          message1 = "Blazes!";
          message2 = "Get My Repair Kit & Try Again!";
        }
        context.font = "70px " + this.fontFamily;
        context.fillText(
          message1,
          this.game.width * 0.5,
          this.game.height * 0.5 - 20
        );

        context.font = "25px " + this.fontFamily;
        context.fillText(
          message2,
          this.game.width * 0.5,
          this.game.height * 0.5 + 20
        );
      }
      //ammo
      if (this.game.player.powerUp) context.fillStyle = "#ffffbd";
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20 + 5 * i, 50, 3, 20);
      }
      context.restore();
    }
  }
  class Game {
    //main game class (it puts together all the above classes)
    constructor(width, height) {
      this.width = width;
      this.height = height;
      //creating objects for the above classes
      this.background = new Background(this);
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new Ui(this);
      this.keys = [];//array of user pressed keys
      this.enemies = [];//array of enemies in the canvas currently
      this.particles = [];//array of particles after the enemy is defeated
      this.explosions=[];//explosion effects 
      this.enemyTimer = 0;
      this.enemyInterval = 2000;//time interval between 2 enemies
      this.ammo = 20;//initial ammo
      this.maxammo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 350;//ammo recharging time interval
      this.gameOver = false;//initially the game is not over
      this.score = 0;//opening score
      this.winningScore = 200;//upon achieving 20 score in the specified time limit, the player wins the game
      this.gameTime = 0;
      this.TimeLimit = 80000;//time limit 
      this.speed = 1;
      this.debug = false;//initially the game is not in debug mode
    }
    update(deltaTime) {//update the game timer ,ammo decrement and increment,explosions and projectiles
      if (!this.gameOver) this.gameTime += deltaTime;//if the game is not over yet,keep increasing the timer
      if (this.gameTime > this.TimeLimit) this.gameOver = true;
      this.background.update();
      this.background.layer4.update();
      this.player.update(deltaTime);
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxammo) this.ammo++;//increment the ammo
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter(//returns the array of particles that are still present inside the canvas
        (particle) => !particle.markedForDeletion
      );
      this.explosions.forEach((explosion) => explosion.update(deltaTime));
      this.explosions = this.explosions.filter(//returns the array of explosions that are still present inside the canvas
        (explosion) => !explosion.markedForDeletion
      );
      this.enemies.forEach((enemy) => {//delete the enemy and add new enemies
        enemy.update();
        if (this.checkCollisions(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.addExplosion(enemy);
          for (let i = 0; i < enemy.score; i++) {
            this.particles.push(
              new particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
          }
          if (enemy.type === "lucky") this.player.enterPowerUp();//if a lucky fish collides ,enter the power up mode
          else if(!this.gameOver) this.score--;//if any other enemy collides ,decrease the score
        }
        this.player.projectiles.forEach((projectile) => {//if the projectile collides with the enemy ,reduce enemy lives
          if (this.checkCollisions(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            this.particles.push(
              new particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );

            if (enemy.lives <= 0) { //if the enemy is defeated , add particles and explosions  on to the canvas screen 
              for (let i = 0; i < enemy.score; i++) {
                this.particles.push(
                  new particle(
                    this,
                    enemy.x + enemy.width * 0.5,
                    enemy.y + enemy.height * 0.5
                  )
                );
              }
              enemy.markedForDeletion = true;//delete the enemy
              this.addExplosion(enemy);
              if(enemy.type === 'hive'){//if a hiveWhale is collided , more drone enemies are erupted out of the hiveWhale
                for(let i=1;i<5;i++)
                this.enemies.push(new Drone(this,enemy.x+Math.random()*enemy.width,enemy.y+Math.random()*enemy.height*0.5));
              }

              if (!this.gameOver) this.score += enemy.score;//keep incrementing the score of the  player until the game is not over

             // if (this.score > this.winningScore) this.gameOver = true;
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
      if (this.enemyTimer > this.enemyInterval && !this.gameOver) { //add new enemies 
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
    draw(context) {//draw the backgrounds,players,enemies,explosions
      this.background.draw(context);
      this.ui.draw(context);
      this.player.draw(context);

      this.particles.forEach((particle) => particle.draw(context));
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.explosions.forEach((explosion) => {
        explosion.draw(context);
      });
      this.background.layer4.draw(context);
    }
    addEnemy() {//adds enemies 
      const randomize = Math.random();
      if (randomize < 0.3) this.enemies.push(new Angler1(this));
      else if (randomize < 0.6) this.enemies.push(new Angler2(this));
     
      else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
      else this.enemies.push(new LuckyFish(this));
      //this.enemies.push(new Angler1(this));
    }
    addExplosion(enemy){//add explosions
      const randomize=Math.random();
      if(randomize<0.5){
        this.explosions.push(new smokeExplosion(this,enemy.x+enemy.width*0.5,enemy.y+enemy.height*0.5));
        console.log(this.explosions);
      }
      else{
        this.explosions.push(new FireExplosion(this,enemy.x+enemy.width*0.5,enemy.y+enemy.height*0.5));
console.log(this.explosions)
      }
}
    checkCollisions(rect1, rect2) {//function to check for collisions
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y
      );
    }
  }
  const game = new Game(canvas.width, canvas.height);//create the game object
  let lastTime = 0;
  //animation loop calls the function 60 frames per second
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;

    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw(ctx);
    game.update(deltaTime);
   
    requestAnimationFrame(animate); //creates endless animation
  }
  animate(0);
});
