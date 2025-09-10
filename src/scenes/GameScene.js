class Creature extends Phaser.GameObjects.Container {
    constructor(scene, x, y, bodyKey, limbConfigs, eyeConfigs, mouthConfigs) {
        super(scene, x, y);
        this.scene = scene;
        this.mouths = [];
        this.normalMouthConfigs = mouthConfigs;

        // Create the body
        const body = this.scene.add.sprite(0, 0, bodyKey);
        this.add(body);

        // Create limbs
        limbConfigs.forEach(config => {
            const limb = this.scene.add.sprite(config.x, config.y, 'creature_limb');
            limb.setAngle(config.angle);
            this.add(limb);
            // Add limb animation
            this.scene.tweens.add({
                targets: limb,
                angle: limb.angle + Phaser.Math.RND.pick([-45, 45]),
                duration: Phaser.Math.Between(1000, 2000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            // Add mouth to limb if specified
            if (config.hasMouth) {
                const mouthOnLimb = this.scene.add.sprite(limb.x, limb.y + 25, config.mouthKey);
                this.add(mouthOnLimb);
                this.mouths.push({ sprite: mouthOnLimb, normalKey: config.mouthKey });
            }
        });

        // Create eyes
        eyeConfigs.forEach(config => {
            const eye = this.scene.add.sprite(config.x, config.y, config.key);
            this.add(eye);
        });

        // Create mouths on body
        mouthConfigs.forEach(config => {
            const mouth = this.scene.add.sprite(config.x, config.y, config.key);
            this.add(mouth);
            this.mouths.push({ sprite: mouth, normalKey: config.key });
        });

        // Add the container to the scene
        this.scene.add.existing(this);
    }

    setMood(mood) {
        if (mood === 'sad') {
            this.mouths.forEach(mouth => {
                mouth.sprite.setTexture('creature_mouth_3');
            });
        } else {
            this.mouths.forEach(mouth => {
                mouth.sprite.setTexture(mouth.normalKey);
            });
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
        const randomColor = Phaser.Display.Color.RandomRGB(100, 255).color;
        let graphics = this.make.graphics({ fillStyle: { color: randomColor } });
        graphics.fillCircle(50, 50, 50);
        graphics.generateTexture('creature_body', 100, 100);
        graphics.destroy();

        // Limb
        graphics = this.make.graphics({ fillStyle: { color: randomColor } });
        graphics.fillRoundedRect(0, 0, 20, 50, 8);
        graphics.generateTexture('creature_limb', 20, 50);
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
        graphics.arc(25, 15, 10, 0, Math.PI, false); // Smaller radius, adjusted Y
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
        graphics.arc(25, 15, 10, 0, Math.PI, true); // Smaller radius, adjusted Y
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

        // Book (intelligence power-up)
        graphics = this.make.graphics({ fillStyle: { color: 0x0000FF } });
        graphics.fillRect(0, 0, 50, 60);
        graphics.generateTexture('powerup_book', 50, 60);
        graphics.destroy();

        // Soap (hygiene power-up)
        graphics = this.make.graphics({ fillStyle: { color: 0xFFC0CB } });
        graphics.fillRoundedRect(0, 0, 60, 40, 10);
        graphics.generateTexture('powerup_soap', 60, 40);
        graphics.destroy();

        // Barbell (muscle power-up)
        graphics = this.make.graphics();
        graphics.fillStyle(0x36454F); // Charcoal
        graphics.fillRect(0, 15, 60, 10); // Bar
        graphics.fillRect(5, 5, 10, 30);  // Left weight
        graphics.fillRect(45, 5, 10, 30); // Right weight
        graphics.generateTexture('powerup_barbell', 60, 40);
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
        this.hasAchievedNirvana = false;

        this.generateAndDisplayCreature();
        this.createUI();

        this.pooGroup = this.add.group();
        this.updatePooPiles();
        this.resetIdleTimer();

        // Power-up implementation
        this.powerupGroup = this.add.group();
        this.time.addEvent({
            delay: 7000, // Spawn every 7 seconds
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });
    }

    spawnPowerup() {
        const powerupTypes = [
            { key: 'powerup_book', stat: 'intelligence', amount: 15 },
            { key: 'powerup_soap', stat: 'hygiene', amount: 10 },
            { key: 'powerup_barbell', stat: 'muscle', amount: 10 }
        ];

        const type = Phaser.Math.RND.pick(powerupTypes);
        const x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
        const y = Phaser.Math.Between(250, this.sys.game.config.height - 150);

        const powerup = this.powerupGroup.create(x, y, type.key);
        powerup.setInteractive();

        powerup.on('pointerdown', () => {
            this.increaseStat(type.stat, type.amount);
            powerup.destroy();
        });

        // Make power-up disappear after a while
        this.time.delayedCall(5000, () => {
            if (powerup.active) {
                powerup.destroy();
            }
        });
    }

    createUI() {
        this.createStatDisplays();
        this.createScreenshotButton();

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
        this.cleanButton.on('pointerdown', () => this.increaseStat('hygiene'));
        this.studyButton.on('pointerdown', () => this.increaseStat('intelligence'));
    }

    increaseStat(stat, amount = 1) {
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
        const statY1 = 50;
        const statY2 = 150; // Increased vertical spacing

        // Create stat bars
        this.statBars.hygiene = this.createStatBar(200, statY1, 'Hygiene', this.stats.hygiene);
        this.statBars.fun = this.createStatBar(200, statY2, 'Fun', this.stats.fun);
        this.statBars.muscle = this.createStatBar(this.sys.game.config.width - 200, statY1, 'Muscle', this.stats.muscle);
        this.statBars.intelligence = this.createStatBar(this.sys.game.config.width - 200, statY2, 'Intelligence', this.stats.intelligence);

        // Rebirth counter
        this.rebirthText = this.add.text(this.sys.game.config.width / 2, 80, `Rebirths: ${this.rebirths}`, {
            fontSize: '40px',
            color: '#000000'
        }).setOrigin(0.5);
    }

    createStatBar(x, y, label, initialValue) {
        const bg = this.add.sprite(x, y, 'stat_bar_bg').setOrigin(0.5);

        const bar = this.add.graphics();
        const barWidth = bg.width - 20;
        const barHeight = bg.height - 20;

        // Position label below the bar
        const textLabel = this.add.text(x, y + 35, label, {
            fontSize: '24px', color: '#000000'
        }).setOrigin(0.5);

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
        const bodyKey = 'creature_body';
        const eyeOptions = ['creature_eyes_1', 'creature_eyes_2'];
        const mouthOptions = ['creature_mouth_1', 'creature_mouth_2']; // Normal mouths only
        const bodyRadius = 50;

        // --- Generate Configs ---
        const limbConfigs = [];
        const numLimbs = Phaser.Math.Between(2, 8);
        for (let i = 0; i < numLimbs; i++) {
            const hasMouth = Phaser.Math.RND.frac() < 0.25; // 25% chance of mouth on limb
            limbConfigs.push({
                x: Math.cos(Phaser.Math.DegToRad(i * (360 / numLimbs))) * bodyRadius,
                y: Math.sin(Phaser.Math.DegToRad(i * (360 / numLimbs))) * bodyRadius,
                angle: Phaser.Math.Between(0, 360),
                hasMouth: hasMouth,
                mouthKey: hasMouth ? Phaser.Math.RND.pick(mouthOptions) : null
            });
        }

        const eyeConfigs = [];
        const numEyes = Phaser.Math.Between(1, 4);
        for (let i = 0; i < numEyes; i++) {
            eyeConfigs.push({
                x: Phaser.Math.Between(-35, 35),
                y: Phaser.Math.Between(-30, 0),
                key: Phaser.Math.RND.pick(eyeOptions)
            });
        }

        const mouthConfigs = [];
        const numMouths = Phaser.Math.Between(1, 2);
        for (let i = 0; i < numMouths; i++) {
            mouthConfigs.push({
                x: Phaser.Math.Between(-20, 20),
                y: Phaser.Math.Between(10, 35),
                key: Phaser.Math.RND.pick(mouthOptions)
            });
        }

        // --- Create Creature ---
        this.creature = new Creature(
            this,
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            bodyKey,
            limbConfigs,
            eyeConfigs,
            mouthConfigs
        );
    }

    update() {
        if (this.hasAchievedNirvana) {
            return; // Stop all updates if Nirvana is achieved
        }
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

        // CHECK FOR NIRVANA
        if (this.rebirths >= 100) {
            this.hasAchievedNirvana = true;
            this.cameras.main.setBackgroundColor('#90EE90'); // Light green
            this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Achieved Nirvana', {
                fontSize: '64px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Stop timers and hide game elements
            this.time.removeAllEvents();
            this.creature.setVisible(false);
            this.powerupGroup.clear(true, true);
            this.pooGroup.clear(true, true);
            return;
        }

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

    createScreenshotButton() {
        const button = this.add.dom(this.sys.game.config.width / 2, 20).createFromHTML('<button style="font-size: 18px; padding: 5px 10px;">Screenshot your creature</button>');
        button.addListener('click');
        button.on('click', () => {
            this.game.renderer.snapshot(image => {
                this.copyImageToClipboard(image);
            });
        });
    }

    async copyImageToClipboard(image) {
        try {
            const blob = await this.canvasToBlob(image);
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Image copied to clipboard.');
            // Optional: Add a visual confirmation for the user
            const feedbackText = this.add.text(this.sys.game.config.width / 2, 50, 'Copied to clipboard!', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => feedbackText.destroy());
        } catch (err) {
            console.error('Failed to copy image: ', err);
            // Optional: Add a visual error message for the user
            const feedbackText = this.add.text(this.sys.game.config.width / 2, 50, 'Failed to copy image.', { fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => feedbackText.destroy());
        }
    }

    canvasToBlob(canvas) {
        return new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
        });
    }
}
