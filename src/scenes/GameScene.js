class Creature extends Phaser.GameObjects.Container {
    constructor(scene, x, y, bodyKey, eyesKey, mouthKey) {
        super(scene, x, y);
        this.scene = scene;

        // Create the parts
        const body = this.scene.add.sprite(0, 0, bodyKey);
        const eyes = this.scene.add.sprite(0, -10, eyesKey);
        this.mouth = this.scene.add.sprite(0, 25, mouthKey);
        this.normalMouthKey = mouthKey;

        // Add parts to the container
        this.add(body);
        this.add(eyes);
        this.add(this.mouth);

        // Add the container to the scene
        this.scene.add.existing(this);
    }

    setMood(mood) {
        if (mood === 'sad') {
            this.mouth.setTexture('creature_mouth_3');
        } else {
            this.mouth.setTexture(this.normalMouthKey);
        }
    }

    startIdleAnimation() {
        if (this.idleTween) {
            return; // Already tweening
        }
        this.idleTween = this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            angle: { from: -5, to: 5 },
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    stopIdleAnimation() {
        if (this.idleTween) {
            this.idleTween.stop();
            this.idleTween = null;
            // Reset position after tween is stopped
            this.y = this.scene.sys.game.config.height / 2;
            this.angle = 0;
        }
    }
}

export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    preload() {
        // Generate placeholder assets
        this.generateCreatureAssets();
        this.generateUiAssets();
    }

    generateCreatureAssets() {
        // Body
        let graphics = this.make.graphics({ fillStyle: { color: 0x00ff00 } });
        graphics.fillCircle(50, 50, 50);
        graphics.generateTexture('creature_body', 100, 100);
        graphics.destroy();

        // Eyes style 1
        graphics = this.make.graphics({ fillStyle: { color: 0x000000 } });
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('creature_eyes_1', 20, 20);
        graphics.destroy();

        // Eyes style 2
        graphics = this.make.graphics({ fillStyle: { color: 0x000000 } });
        graphics.fillEllipse(10, 10, 15, 8);
        graphics.generateTexture('creature_eyes_2', 20, 20);
        graphics.destroy();

        // Mouth style 1 (smile)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.beginPath();
        graphics.moveTo(5, 5);
        graphics.quadraticCurveTo(25, 30, 45, 5);
        graphics.strokePath();
        graphics.generateTexture('creature_mouth_1', 50, 25);
        graphics.destroy();

        // Mouth style 2 (straight)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.lineBetween(5, 5, 45, 5);
        graphics.generateTexture('creature_mouth_2', 50, 10);
        graphics.destroy();

        // Mouth style 3 (sad)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.beginPath();
        graphics.moveTo(5, 25);
        graphics.quadraticCurveTo(25, 0, 45, 25);
        graphics.strokePath();
        graphics.generateTexture('creature_mouth_3', 50, 30);
        graphics.destroy();
    }

    generateUiAssets() {
        // Button
        let graphics = this.make.graphics({ fillStyle: { color: 0x888888 } });
        graphics.fillRoundedRect(0, 0, 200, 80, 20);
        graphics.generateTexture('ui_button', 200, 80);
        graphics.destroy();

        // Stat bar background
        graphics = this.make.graphics({ fillStyle: { color: 0xcccccc } });
        graphics.fillRect(0, 0, 300, 40);
        graphics.generateTexture('stat_bar_bg', 300, 40);
        graphics.destroy();

        // Poo pile
        graphics = this.make.graphics({ fillStyle: { color: 0x8B4513 } });
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('poo', 20, 20);
        graphics.destroy();
    }

    create() {
        // Initialize stats
        this.stats = {
            hygiene: 50,
            fun: 50,
            muscle: 50,
            intelligence: 50
        };
        this.rebirths = 0;
        this.idleTimer = null;

        this.generateAndDisplayCreature();
        this.createUI();

        this.pooGroup = this.add.group();
        this.updatePooPiles();
        this.resetIdleTimer();
    }

    createUI() {
        this.createStatDisplays();

        // Button positions
        const buttonY = this.sys.game.config.height - 80;
        const buttonPositions = {
            feed: this.sys.game.config.width * 0.2,
            play: this.sys.game.config.width * 0.4,
            clean: this.sys.game.config.width * 0.6,
            study: this.sys.game.config.width * 0.8
        };

        // Create buttons
        this.feedButton = this.createButton(buttonPositions.feed, buttonY, 'Feed');
        this.playButton = this.createButton(buttonPositions.play, buttonY, 'Play');
        this.cleanButton = this.createButton(buttonPositions.clean, buttonY, 'Clean');
        this.studyButton = this.createButton(buttonPositions.study, buttonY, 'Study');

        // Add button events
        this.feedButton.on('pointerdown', () => this.increaseStat('muscle'));
        this.playButton.on('pointerdown', () => this.increaseStat('fun'));
        this.cleanButton.on('pointerdown', () => this.increaseStat('hygiene', 15)); // As per user request
        this.studyButton.on('pointerdown', () => this.increaseStat('intelligence'));
    }

    increaseStat(stat, amount = 10) {
        // Stop any idle animation and reset the timer
        this.creature.stopIdleAnimation();
        this.resetIdleTimer();

        this.stats[stat] = Math.min(100, this.stats[stat] + amount);
        this.statBars[stat].update(this.stats[stat]);

        if (stat === 'hygiene') {
            const pooToRemove = this.pooGroup.getFirstAlive();
            if (pooToRemove) {
                pooToRemove.destroy();
            }
        }
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            this.idleTimer.remove();
        }
        this.idleTimer = this.time.delayedCall(5000, () => {
            this.creature.startIdleAnimation();
        });
    }

    updatePooPiles() {
        const targetPooCount = Math.floor((100 - this.stats.hygiene) / 20);
        let currentPooCount = this.pooGroup.getLength();

        while (currentPooCount < targetPooCount) {
            const x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
            const y = Phaser.Math.Between(200, this.sys.game.config.height - 200);
            const newPoo = this.pooGroup.create(x, y, 'poo');
            newPoo.setScale(Phaser.Math.Between(1, 2));
            currentPooCount++;
        }
    }

    createButton(x, y, text) {
        const button = this.add.sprite(x, y, 'ui_button').setInteractive();
        button.setScale(0.8);

        const buttonText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add hover effect
        button.on('pointerover', () => {
            button.setTint(0xcccccc);
        });
        button.on('pointerout', () => {
            button.clearTint();
        });

        return button;
    }

    createStatDisplays() {
        this.statBars = {};
        const statY = 50;

        // Create stat bars
        this.statBars.hygiene = this.createStatBar(180, statY, 'Hygiene', this.stats.hygiene);
        this.statBars.fun = this.createStatBar(180, statY + 60, 'Fun', this.stats.fun);
        this.statBars.muscle = this.createStatBar(this.sys.game.config.width - 180, statY, 'Muscle', this.stats.muscle);
        this.statBars.intelligence = this.createStatBar(this.sys.game.config.width - 180, statY + 60, 'Intelligence', this.stats.intelligence);

        // Rebirth counter
        this.rebirthText = this.add.text(this.sys.game.config.width / 2, 50, `Rebirths: ${this.rebirths}`, {
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);
    }

    createStatBar(x, y, label, initialValue) {
        const bg = this.add.sprite(x, y, 'stat_bar_bg').setOrigin(0.5);

        const bar = this.add.graphics();
        const barWidth = bg.width - 20;
        const barHeight = bg.height - 20;

        const textLabel = this.add.text(x - bg.width/2 - 10, y, label, {
            fontSize: '24px', color: '#000000'
        }).setOrigin(1, 0.5);

        const valueText = this.add.text(x, y, '', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        const updateBar = (value) => {
            bar.clear();
            bar.fillStyle(0x00ff00);
            bar.fillRect(x - barWidth / 2, y - barHeight / 2, barWidth * (value / 100), barHeight);
            valueText.setText(`${value} / 100`);
        };

        updateBar(initialValue);

        return { update: updateBar };
    }

    generateAndDisplayCreature() {
        const bodyOptions = ['creature_body']; // Only one body type for now
        const eyeOptions = ['creature_eyes_1', 'creature_eyes_2'];
        const mouthOptions = ['creature_mouth_1', 'creature_mouth_2', 'creature_mouth_3'];

        // Randomly select parts
        const bodyKey = Phaser.Math.RND.pick(bodyOptions);
        const eyesKey = Phaser.Math.RND.pick(eyeOptions);
        const mouthKey = Phaser.Math.RND.pick(mouthOptions);

        // Create the creature
        this.creature = new Creature(
            this,
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            bodyKey,
            eyesKey,
            mouthKey
        );
    }

    update() {
        this.checkCreatureMood();
        this.checkForRebirth();
    }

    checkForRebirth() {
        for (const stat in this.stats) {
            if (this.stats[stat] >= 100) {
                this.triggerRebirth();
                break; // Only one rebirth at a time
            }
        }
    }

    triggerRebirth() {
        // 1. Flash of light
        const flash = this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0xffffff).setOrigin(0);
        flash.setAlpha(0);
        this.tweens.add({
            targets: flash,
            alpha: { from: 0, to: 1 },
            duration: 200,
            yoyo: true,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 2. Increment counter
        this.rebirths++;
        this.rebirthText.setText(`Rebirths: ${this.rebirths}`);

        // 3. Reset stats
        for (const stat in this.stats) {
            this.stats[stat] = 50;
        }

        // 4. Update stat bars
        for (const stat in this.statBars) {
            this.statBars[stat].update(this.stats[stat]);
        }

        // 5. Destroy old creature
        this.creature.destroy();

        // 6. Generate new creature
        this.generateAndDisplayCreature();
    }

    checkCreatureMood() {
        if (this.stats.muscle < 30) {
            this.creature.setMood('sad');
        } else {
            this.creature.setMood('normal');
        }
    }

}
