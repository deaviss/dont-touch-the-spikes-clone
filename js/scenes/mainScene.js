export class mainScene extends Phaser.Scene {
  constructor () {
    super({ key: 'mainScene' })
	}

	preload(){
		this.load.image('wall', 'img/wall.png')

		this.load.image('button', 'img/button.png')
		this.load.image('shopButton', 'img/shopButton.png')

		this.load.image('gold', 'img/items/I_GoldCoin.png')

		this.load.atlas('sheet', 'img/game-sprites.png', 'img/game-sprites.json');
		this.load.json('shapes', 'img/game-shapes.json');

		this.load.image('Bird_trail', 'img/birds_trails/Bird.png');
		this.load.image('Bird1_trail', 'img/birds_trails/Bird1.png');
		this.load.image('Bird2_trail', 'img/birds_trails/Bird2.png');


		this.load.audio('collect', 'sound/collect.wav')
		this.load.audio('death1', 'sound/death1.wav')
		this.load.audio('death2', 'sound/death2.wav')

		this.cameras.main.setBackgroundColor('#eaeaea')
	}
	
	create() { 
		var shapes = this.cache.json.get('shapes')
		this.shapes = shapes;
		this.spikes_top_bottom = [];
		this.currentSpikes = [];
		this.trails = [];
		
		this.createMap();

		this.collectSound = this.sound.add('collect');
		this.deathSound1 = this.sound.add('death1')
		this.deathSound2 = this.sound.add('death2')

		this.pointsText = this.add.text(this.game.config.width / 2, 380, 0, {
			fontFamily: 'Arial',
			fontSize: '244px',
			color: '#a6a6a6',
			stroke: '#333',
			strokeThickness: 9
		}).setOrigin(0.5,0.5).setAlpha(0.3)

		
		this.gameConfig = {
			debug: true
		}
		// player's attributes
		this.player = {
			bird: this.matter.add.image(this.game.config.width / 2, 360, 'sheet', 'bird', {shape: shapes.bird}).setIgnoreGravity(true).setFrictionAir(0.8),
			friction: 1.4,
			velocityX: 19,
			velocityY: 8,
			velocityXMax: 24, 
			jumpPower: 30,
			alive: true,
			gold: this.canLoad() ? parseInt(localStorage.getItem('gold')) : 0,
			highScore: this.canLoad() ? parseInt(localStorage.getItem('highscore')) : 0,
			ownedBirds: this.canLoad() ? JSON.parse(localStorage.getItem('ownedBirds')) : [{
				name: 'Bird',
				sprite: 'bird'
			}],
			currentBird: this.canLoad() ? JSON.parse(localStorage.getItem('currentBird')) : {
				name: 'Bird',
				sprite: 'bird'
			}
		};
		this.player.bird.setTexture('sheet', this.player.currentBird.sprite)
		this.player.tween = this.tweens.add({
			targets: this.player.bird,
			y: '+=40',
			ease: 'Quad.easeIn',
			duration: 700,
			yoyo: true,
			repeat: -1
		})


		this.world = {
			started: false,
			side: 'right',
			points: 0,
			pickedGold: false
		}

		this.createUI();

		this.zone = this.add.zone(0,0, 1000, 1000).setInteractive().setOrigin(0,0);

		this.createMenuButtons();
		



		this.zone.on('pointerdown', ()=>{
			if(!this.world.started){ 
				this.startGame();
				this.onPlayerJump();
			}else {
				this.onPlayerJump();
			}
		}, this)

		if(this.gameConfig.debug){
			window.player = this.player;
		}

		
		// collisions
		this.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
			this.checkCollisions(bodyA, bodyB)
		}, this);

		// ads
		this.createAdButton();

	}

	onPlayerJump(){
		this.player.velocityY = -this.player.jumpPower;
		this.addTrail();
	}

	addTrail(){
		var t = this;
		this.trails = [];
		var xoffset = 11;
		var yoffset = 16;
		console.log(this.player.currentBird.name)
		var sprite = `${this.player.currentBird.name}_trail`;
		var t1 = t.add.sprite(t.world.side == 'right' ? t.player.bird.x - xoffset : t.player.bird.x + xoffset, t.player.bird.y + yoffset, sprite).setScale(0.6);
		var tween = t.tweens.add({
			targets: t1,
			duration: 300,
			alpha: 0
		})
		this.trails.push(t1);
		setTimeout(() => {
			var t2 = t.add.sprite(t.world.side == 'right' ? t.player.bird.x - xoffset : t.player.bird.x + xoffset, t.player.bird.y + yoffset, sprite).setScale(0.8);
			var tween = t.tweens.add({
				targets: t2,
				duration: 300,
				alpha: 0
			})
			this.trails.push(t2);
		}, 100);
		setTimeout(() => {
			var t3 = t.add.sprite(t.world.side == 'right' ? t.player.bird.x - xoffset : t.player.bird.x + xoffset, t.player.bird.y + yoffset, sprite).setScale(1);
			var tween = t.tweens.add({
				targets: t3,
				duration: 300,
				alpha: 0
			})
			this.trails.push(t3);
		}, 200);
	}

	createAdButton() {
		var t = this;
		document.addEventListener('admob.rewardvideo.events.LOAD', function(event) {
			if(admob){
				console.log('ad loaded!')
				setTimeout(() => {
					t.adButton = t.add.rectangle(150,150,100,200, 0x00ff00).setInteractive();
					t.adButton.on('pointerdown', function(){
						admob.rewardvideo.show();
					})
				}, 9000);
			}
		})
		document.addEventListener('admob.rewardvideo.events.LOAD_FAIL', function (event) {
			console.log(`couldnt load ad video. retrying in 2 minutes`);
			setTimeout(() => {
				admob.rewardvideo.prepare();
			}, 120000);
		});
		document.addEventListener('admob.rewardvideo.events.CLOSE', function(event) {
			if(t.adButton){
				t.adButton.destroy();
			}
			admob.rewardvideo.prepare()
		})
		document.addEventListener('admob.rewardvideo.events.REWARD', function(event) {
			var amount = event.rewardAmount;
			var type = event.rewardType;
			t.player.gold += amount;
			t.goldText.text = `Gold ${t.player.gold}`
			t.saveGame();
		})
	}

	createMenuButtons(){
		this.menuButtons = this.add.group();

		this.shopButton = this.add.sprite(this.game.config.width / 2, 510, 'shopButton').setInteractive().setScale(0.7).setAlpha(0.8);

		this.shopButton.on('pointerdown', function(){
			this.scene.pause()
			// this.scene.launch('shopScene')
			this.scene.switch('shopScene');
		},this)

		this.menuButtons.add(this.shopButton);
	}

	checkCollisions(bodyA, bodyB){
		if((bodyA.parent.label == 'bird' || bodyB.parent.label == 'bird')){
			if(bodyA.parent.label == 'wall' || bodyB.parent.label == 'wall'){
				this.deleteSpikes();
				this.world.points += 1;

				if(this.world.pickedGold == true){
					this.pickedGold();
				}

				if(this.world.side == 'right'){
					this.player.bird.setAngle(0);
					this.player.bird.scaleX = -1;
					this.world.side = 'left'
					this.addSpikes()
				}
				else {
					this.player.bird.setAngle(0);
					this.world.side = 'right'
					this.player.bird.scaleX = 1;
					this.addSpikes()
				}
			}
			if(bodyA.parent.label == 'spike' || bodyB.parent.label == 'spike'){
				console.log('touched the spike!')
				this.cameras.main.shake(100, 0.01, false)
				this.gameOver()
			}
			// if(bodyA.parent.label == 'gold' || bodyB.parent.label == 'gold'){
			// 	this.gold.destroy();
			// }
			
			this.pointsText.text = this.world.points;
		}
	}

	update(){
		this.player.bird.setAngle(0)
		if(this.gold){
			if(this.checkOverlap(this.player.bird, this.gold) && !this.world.pickedGold){
				this.collectSound.play();
				this.gold.setPosition(-100, -100);
				this.gold.tween.stop();
				this.world.pickedGold = true;
				this.player.gold++;
			}
		}
		if(this.world.started && this.player.alive){
			
			var player = this.player;
			var velX = player.velocityX + (this.world.points / 3)
			if(velX >= player.velocityXMax)
				velX = player.velocityXMax
			player.bird.setVelocity(this.world.side == 'right' ? velX : - velX, player.velocityY);
			
			if(player.velocityY <= 77)
				player.velocityY += player.friction
		}
		// this.currentSpikes.forEach(spike => {
		// 	spike.y += 1.3;
		// });
	}

	pickedGold() {
		this.world.pickedGold = false;
		var x = this.world.side == 'right' ? 120 : this.game.config.width - 120;
		var y = Phaser.Math.RND.between(100, 600);
		this.gold.tween.stop();
		this.gold.setPosition(x, y);
		this.gold.tween = this.tweens.add({
			targets: this.gold,
			y: '+=20',
			yoyo: true,
			repeat: -1,
			ease: 'Linear'
		})
	}

	createMap(){
		var _this = this;
		for(var i = 0; i < 10; i++){
			var y1 = -5;
			var y2 = this.game.config.height - 195;
			var gap = i * 44.5;
			var spikeTop = this.matter.add.image(70 + gap, y1, 'sheet', 'spike', {shape: _this.shapes.spike}).setIgnoreGravity(true)
			spikeTop.setAngle(180);
			var spikeBot = this.matter.add.image(70 + gap, y2, 'sheet', 'spike', {shape: _this.shapes.spike}).setIgnoreGravity(true)
			this.spikes_top_bottom.push(spikeTop,spikeBot)
		}
		this.leftWall = this.matter.add.image(24, 480, 'sheet', 'wall', {shape: _this.shapes.wall})
		this.rightWall = this.matter.add.image(540 - 24, 480, 'sheet', 'wall', {shape: _this.shapes.wall})
		this.add.rectangle(0, this.game.config.height - 200, 900, 400, 0x7f7f7f).setOrigin(0,0);
	}

	createUI(){
		this.texts = this.add.group();
		
		this.highScoreText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 170, `Highscore ${this.player.highScore}`, {
			fontSize: '34px',
			color: '#a6a6a6',
			stroke: '#333',
			strokeThickness: 2
		}).setOrigin(0.5,0.5)
		this.goldText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 220, `Gold ${this.player.gold}`, {
			fontSize: '34px',
			color: '#a6a6a6',
			stroke: '#333',
			strokeThickness: 2
		}).setOrigin(0.5,0.5)

		this.texts.add(this.highScoreText);
		this.texts.add(this.goldText);

	}

	startGame(){
		var _this = this;
		if(!this.world.started){
			this.player.tween.stop();
			this.texts.toggleVisible();
			this.menuButtons.toggleVisible();
			this.player.alive = true;
			

			var x = -100; 
			var y = -100;


			this.gold = this.add.sprite(x, y, 'gold')
			this.gold.tween = this.tweens.add({
				targets: this.gold,
				y: '+=20',
				yoyo: true,
				repeat: -1,
				ease: 'Linear'
			})

			this.world.pickedGold = true;
			this.world.started = true;
		}
	}

	createNewSpike(poz) {
		var _this = this;
		var side = this.world.side;
		// if spikes are not moving: baseY = 30
		// if spikes are moving: baseY = -90
		var baseY = 30;
		var baseX = side == 'right' ? this.game.config.width - 9 : 9;

		

		var gap = poz * 69
		var newSpike = this.matter.add.image(baseX, baseY + gap, 'sheet', 'spike', {shape: _this.shapes.spike})
		newSpike.setAngle(side == 'right' ? -90 : 90);
		newSpike.setScale(0.85)
		newSpike.POZ = poz;

		newSpike.tween = this.tweens.add({
			targets: newSpike,
			x: side == 'right' ? '-=40' : '+=40',
			ease: 'Linear',
			duration: 200,
			repeat: 0
		})



		this.currentSpikes.push(newSpike)
	}

	addSpikes(){
		var i = 0;
		var rnd = Phaser.Math.RND.between(this.world.points / 5,this.world.points / 3);
		// if spikes are not moving then: amount=3 + random; amount = 7;
		// if spikes are moving then: amount=4 + random; amount = 9;
		var amount = 3 + rnd;
		if(amount > 7) amount = 7;
		while (i < amount){
			var poz = Phaser.Math.RND.between(1,9);
			
			var canAdd = true;
			if(this.currentSpikes.length > 0){
				this.currentSpikes.forEach(spike => {
					if(poz == spike.POZ){
						canAdd = false;
					}
				});
			} else{
				canAdd = true;
			}
			if(canAdd){
				this.createNewSpike(poz);
				i++;
			}
		}
	}

	deleteSpikes(){
		this.currentSpikes.forEach(spike => {
			spike.tween.stop();
			spike.destroy();
		});
		this.currentSpikes = [];
	}

	checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
	}	

	gameOver(){
		this.texts.toggleVisible();

		this.deathSound1.play();
		this.deathSound2.play();
		
		this.menuButtons.toggleVisible();

		this.world.started = false;
		this.world.pickedGold = false
		if(this.player.highScore < this.world.points)
			this.player.highScore = this.world.points
		this.player.bird.setPosition(this.game.config.width / 2, this.game.config.height / 2);
		this.player.bird.setAngle(0)

		this.deleteSpikes();
		if(this.gold){
			this.gold.setPosition(-100, -100);
		}
		this.world.points = 0;
		this.world.side = 'right';
		this.player.bird.scaleX = 1;
		this.cameras.main.setBackgroundColor('#eaeaea')
		this.highScoreText.text = `Highscore ${this.player.highScore}`
		this.goldText.text  = `Gold ${this.player.gold}`
		this.player.tween.play();
		this.saveGame();
	}


	canLoad() {
		var test = window.localStorage.getItem('highscore');
		if (test != null) return true;
		return false;
	}

	saveGame() {
		window.localStorage.setItem('highscore', this.player.highScore);
		window.localStorage.setItem('gold', this.player.gold);
		window.localStorage.setItem('currentBird', JSON.stringify(this.player.currentBird));
		window.localStorage.setItem('ownedBirds', JSON.stringify(this.player.ownedBirds));
	}

}

/*

¤ Mapa, sciany po dwoch stronach
¤ Kolce, zalezne od punktow, coraz wiecej
¤ Ptak, ktory opada na grawitacje, kiedy sie kliknie, to velocity ustawia sie na określoną ilość
¤ Punkty, które respią sie kiedy ptak je złapie, a nastepnie odbije sie od ściany 
¤ 3 sceny, rozpoczęcie gry, gra i śmierć, gdzie w ostatniej mozna wrocic do pierwszej sceny, lub zacząć od nowa

Dodatkowo:
¤ Sklep, gdzie mozna zmienkac wygląd ptaka, kupowanie poprzez punkty
¤ Po kazdej smierci sprawdzanie czy rozgrywka byla highscorem, jezeli tak, zastąpić stary i zapisać w pamięci



Po kliknięciu na sklep otwiera sie nowa scena, zostaje przesłany emit 'sendPlayerDetails' czyli złoto gracza
które jest odczytywane w scenie sklepu


*/


function numFormat(num, digits = 2) {
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "k" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "G" },
    { value: 1E12, symbol: "T" },
    { value: 1E15, symbol: "P" },
    { value: 1E18, symbol: "E" }
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}



// left side
// for(var i = 0; i < 20; i++){
// 	var baseY = 60;
// 	var baseX = 50;
// 	var gap = i * 44.5
// 	var newSpike = this.matter.add.image(baseX, baseY + gap, 'sheet', 'spike', {shape: shapes.spike})
// 	newSpike.setAngle(90);
// 	this.currentSpikes.push(newSpike)
// }

// right side
// for(var i = 0; i < 20; i++){
// 	var baseY = 60;
// 	var baseX = this.game.config.width - 50;
// 	var gap = i * 44.5
// 	var newSpike = this.matter.add.image(baseX, baseY + gap, 'sheet', 'spike', {shape: shapes.spike})
// 	newSpike.setAngle(-90);
// 	this.currentSpikes.push(newSpike)
// }