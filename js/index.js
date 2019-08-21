import {mainScene} from './scenes/mainScene.js'
import {shopScene} from './scenes/shopScene.js'
// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  physics: {
    default: "matter",
    matter: {
      debug: false,
    }
  },
  scene: [mainScene, shopScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  autoRound: false
};
let game = new Phaser.Game(config);