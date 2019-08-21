export class shopScene extends Phaser.Scene {
  constructor () {
    super({ key: 'shopScene' })
	}

	preload() {
		this.load.atlas('sheet', 'img/game-sprites.png', 'img/game-sprites.json');
	}

	create() {
		
		this.player = this.scene.get('mainScene').player;
		this.mainGame = this.scene.get('mainScene')
		var t = this;
		this.add.rectangle(0,0,900,960, 0x333).setOrigin(0,0)


		var bgRect = this.add.rectangle(this.game.config.width / 2, this.game.config.height / 2, 400, 800, 0x00c000);
		
		this.createContainer();

		

		this.createAllItems();
		this.iks = this.add.rectangle(this.game.config.width - 40, 30, 20, 20, 0x00f0ff).setInteractive();
		this.iks.on('pointerup', function() {
			// this.scene.stop('shopScene');
			this.player.bird.setTexture('sheet', this.player.currentBird.sprite)
			this.mainGame.goldText.text = this.player.gold;
			this.scene.switch('mainScene');
		},this)


		this.goldText = this.add.text(this.game.config.width / 2, 50, `GOLD: ${this.player.gold}`,{
			fontFamily: 'Arial',
			fontSize: '44px',
			color: '#a6a6a6',
			stroke: '#333',
			strokeThickness: 9
		}).setOrigin(0.5)
	}

	createContainer() {
		var t = this;
		this.container = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
		// this.container.setSize(this.game.config.width * 2 - 250, this.game.config.height * 2 - 350)
		this.container.setSize(400, 800)
		var maskS = this.add.graphics(this.container.x, this.container.y).clear()
			.fillStyle(0x00ffff, 0)
			.fillRect(
				this.container.x - this.container.width / 2, 
				this.container.y - this.container.height / 2,
				this.container.width, this.container.height
			)
		var mask = this.container.createGeometryMask(maskS);
		this.container.setMask(mask);
		this.input.on('pointermove', function (pointer) {
			if (pointer.isDown){
				var first = t.container.getAt(0);
				var second = t.container.getAt(2);
				var last = t.container.getAt(t.container.length - 1);
				var velY = pointer.position.y - pointer.prevPosition.y;
				t.container.each(item=>{
					if(velY > 0 && first.y < -100){
						item.y += velY;
						// dół
					}
					if(velY < 0 && last.y > -100){
						item.y += velY;
						// góra
					}
				})
				first.setY( second.y);
			}
		})
		
	}

	addNewItem(data){
		var t = this;
		var items = []
		t.container.each(e=>{
			if(e.type != 'Text')
				items.push(e);
		})
		// var last = t.container.getAt(t.container.length - 1)
		var last = items[items.length - 1]
		var x = -180;
		var y = -380;
		if(last){
			if( last.x > 30 ){
				y = last.y + 130;
			} else {
				x = last.x + 94;
				y = last.y;
			}
		}
		// var rekt2 = t.add.rectangle(x,y,50,50,0xff0000).setOrigin(0).setInteractive();
		var rekt2 = t.add.sprite(x, y, 'sheet', data.sprite).setOrigin(0).setInteractive().setScale(1.33, 1.33);
		rekt2.data = data;
		var goldText = t.add.text(x + 42, y+90, `Cost ${data.cost}`).setOrigin(0.5)

		rekt2.data.text = goldText;
		rekt2.on('pointerup', function() {
			rekt2.data.cb();
		});
		t.container.add([rekt2, goldText])
	}

	addNewBird(name, sprite, cost) {
		var t = this;
		var newBird = {
			name: name,
			cost: cost,
			sprite: sprite,
			bought: false,
			used: false,
		}

		newBird.cb = function() {
			if(t.player.gold >= this.cost && !this.bought){
				console.log(`You have just bought ${this.name} for ${this.cost} gold!`)
				t.player.gold -= this.cost;
				this.bought = true;
				t.player.ownedBirds.push({
					name: this.name,
					sprite: this.sprite
				})
				
				this.text.text = `OWNED`
			}
			if(t.player.currentBird.name == this.name){
				this.used = true;
			}
			if(this.bought){
				t.player.currentBird = {
					name: this.name,
					sprite: this.sprite
				};
			}
			t.mainGame.saveGame();
		}
		if(t.player.ownedBirds.filter(function(x) {return x.name == newBird.name }).length > 0){
			newBird.bought = true;
		}

		
		this.addNewItem(newBird);
	}
	
	createAllItems(){

		this.addNewBird('Bird', 'bird', 0)
		this.addNewBird('Bird1', 'bird1', 25)
		this.addNewBird('Bird2', 'bird2', 50)
		this.addNewBird('Bird3', 'bird2', 50)
		this.addNewBird('Bird4', 'bird2', 75)


		
	}

	
	
	update(){
		var t = this;
		this.goldText.text = `GOLD: ${this.player.gold}`
		this.container.each(item=>{
			var data = item.data;
			if(data){
				if(!data.bought){
					item.setAlpha(0.3)
				} else {
					item.setAlpha(0.7)
					data.text.text = 'OWNED'
				}
				if(data.name == t.player.currentBird.name){
					item.setAlpha(1)
					data.text.text = 'SELECTED'
				}
			}
		})
	}

}