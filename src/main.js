import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'Zeids Pet Game',
    description: 'A virtual pet game.',
    parent: 'game-container',
    width: 1280,
    height: 720,
    dom: {
        createContainer: true
    },
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
            