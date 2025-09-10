import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.CANVAS,
    title: 'Zeid`s Pet game',
    description: 'A virtual pet game.',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#FFFFFF',
    pixelArt: false,
    scene: [
        GameScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            