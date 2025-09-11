class Creature extends Phaser.GameObjects.Container {
    constructor(scene, x, y, name, bodyKey, limbConfigs, eyeConfigs, mouthConfigs) {
        super(scene, x, y);
        this.scene = scene;
        this.mouths = [];
        this.normalMouthConfigs = mouthConfigs;
        this.creatureName = name;

        // Create the body
        const body = this.scene.add.sprite(0, 0, bodyKey);
        this.add(body);

        // Name is now created in the main scene's UI

        // Create limbs
        limbConfigs.forEach(config => {
            const limb = this.scene.add.sprite(config.x, config.y, 'creature_limb');
            limb.setAngle(config.angle);
            limb.setScale(1, Phaser.Math.FloatBetween(0.5, 1.5)); // Randomize length
            this.add(limb);
            // Add limb animation
            this.scene.tweens.add({
                targets: limb,
                angle: limb.angle + Phaser.Math.RND.pick([-90, 90]),
                scaleY: Phaser.Math.FloatBetween(0.5, 2.0),
                duration: Phaser.Math.Between(500, 1500),
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
            y: this.y - 25,
            angle: { from: -10, to: 10 },
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

    destroy(fromScene) {
        // Destroy all children
        this.list.forEach(child => {
            child.destroy(fromScene);
        });

        // Call the parent's destroy method
        super.destroy(fromScene);
    }
}

export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
        this.syllables = []; // Will be populated from file
        this.lastNumber = null;
    }

    generateUniqueRandomNumber() {
        let newNumber;

        if (this.lastNumber === null) {
           newNumber = Phaser.Math.Between(2, 12);
        } else {
            do {
                newNumber = Phaser.Math.Between(2, 12);
            } while (newNumber === this.lastNumber);
        }

        this.lastNumber = newNumber;

        return newNumber;
    }

    generateBlobShape(centerX, centerY, radius, points) {
        const shapePoints = [];
        const angleStep = (Math.PI * 2) / points;

        for (let i = 0; i < points; i++) {
            const angle = i * angleStep;
            const randomRadius = radius + Phaser.Math.FloatBetween(-radius * 0.2, radius * 0.2);
            const x = centerX + Math.cos(angle) * randomRadius;
            const y = centerY + Math.sin(angle) * randomRadius;
            shapePoints.push(new Phaser.Geom.Point(x, y));
        }
        return shapePoints;
    }
    
    generateRandomName() {
        const numSyllables = Phaser.Math.Between(2, 3);
        let name = '';
        for (let i = 0; i < numSyllables; i++) {
            name += Phaser.Math.RND.pick(this.syllables);
            if (i < numSyllables - 1 && Phaser.Math.RND.frac() < 0.1) {
                name += ' '; // 20% chance of a space
            }
        }
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    preload() {
        this.generateCreatureAssets();
        this.generateUiAssets();
        this.load.image('FoodButton', 'assets/FoodButton.png');
        this.load.image('PlayButton', 'assets/PlayButton.png');
        this.load.image('SoapButton', 'assets/SoapButton.png');
        this.load.image('StudyButton', 'assets/StudyButton.png');
        this.load.text('syllables', 'assets/syllables.txt');
    }

    generateMutableCreatureAssets() {
        if (this.textures.exists('creature_body')) {
            this.textures.remove('creature_body');
        }
        if (this.textures.exists('creature_limb')) {
            this.textures.remove('creature_limb');
        }

        const randomColor = Phaser.Display.Color.RandomRGB(100, 255);

        let graphics = this.make.graphics();
        graphics.fillStyle(randomColor.color, 1);
        const points = this.generateBlobShape(50, 50, 45, this.generateUniqueRandomNumber());
        graphics.fillPoints(points, true);
        graphics.generateTexture('creature_body', 100, 100);
        graphics.destroy();

        graphics = this.make.graphics();
        graphics.fillStyle(randomColor.color, 1);
        graphics.fillRoundedRect(0, 0, 20, 50, 8);
        graphics.generateTexture('creature_limb', 20, 50);
        graphics.destroy();
    }

    generateCreatureAssets() {
        this.generateMutableCreatureAssets();

        let graphics;

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

        // Eyes style 3 (vertical slit)
        graphics = this.make.graphics({ fillStyle: { color: 0x000000 } });
        graphics.fillRect(8, 0, 4, 20);
        graphics.generateTexture('creature_eyes_3', 20, 20);
        graphics.destroy();

        // Eyes style 4 (X shape)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.strokeLineShape(new Phaser.Geom.Line(0, 0, 20, 20));
        graphics.strokeLineShape(new Phaser.Geom.Line(0, 20, 20, 0));
        graphics.generateTexture('creature_eyes_4', 20, 20);
        graphics.destroy();

        // Mouth style 1 (smile)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.beginPath();
        graphics.arc(25, 15, 10, 0, Math.PI, false);
        graphics.strokePath();
        graphics.generateTexture('creature_mouth_1', 50, 25);
        graphics.destroy();

        // Mouth style 2 (straight)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.strokeLineShape(new Phaser.Geom.Line(5, 5, 45, 5));
        graphics.generateTexture('creature_mouth_2', 50, 10);
        graphics.destroy();

        // Mouth style 3 (sad)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.beginPath();
        graphics.arc(25, 15, 10, 0, Math.PI, true);
        graphics.strokePath();
        graphics.generateTexture('creature_mouth_3', 50, 30);
        graphics.destroy();

        // Mouth style 4 (wavy)
        graphics = this.make.graphics();
        const path = new Phaser.Curves.Path(5, 10);
        path.quadraticBezierTo(new Phaser.Math.Vector2(17.5, -5), new Phaser.Math.Vector2(30, 10));
        path.quadraticBezierTo(new Phaser.Math.Vector2(42.5, 25), new Phaser.Math.Vector2(55, 10));
        graphics.lineStyle(4, 0x000000);
        path.draw(graphics);
        graphics.generateTexture('creature_mouth_4', 60, 20);
        graphics.destroy();

        // Mouth style 5 (O shape)
        graphics = this.make.graphics({ lineStyle: { width: 4, color: 0x000000 } });
        graphics.strokeEllipse(25, 15, 20, 10);
        graphics.generateTexture('creature_mouth_5', 50, 30);
        graphics.destroy();
    }

    generateUiAssets() {
        let graphics;

        // Button
        graphics = this.make.graphics({ fillStyle: { color: 0x888888 } });
        graphics.fillRoundedRect(0, 0, 200, 80, 20);
        graphics.generateTexture('ui_button', 200, 80);
        graphics.destroy();

        // Stat bar background
        graphics = this.make.graphics();
        graphics.fillStyle(0x000000);
        graphics.fillRect(0, 0, 300, 40);
        graphics.fillStyle(0xcccccc);
        graphics.fillRect(2, 2, 296, 36);
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
        graphics.fillStyle(0x36454F);
        graphics.fillRect(0, 15, 60, 10);
        graphics.fillRect(5, 5, 10, 30);
        graphics.fillRect(45, 5, 10, 30);
        graphics.generateTexture('powerup_barbell', 60, 40);
        graphics.destroy();

        // Controller (fun power-up)
        graphics = this.make.graphics();
        graphics.fillStyle(0x111111);
        graphics.fillRoundedRect(0, 0, 80, 50, 15);
        graphics.fillStyle(0xdddddd);
        graphics.fillCircle(20, 25, 8);
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(60, 15, 8);
        graphics.fillStyle(0x0000ff);
        graphics.fillCircle(70, 35, 8);
        graphics.generateTexture('powerup_controller', 80, 50);
        graphics.destroy();
    }

    create() {
        this.stats = {
            hygiene: 10,
            fun: 10,
            muscle: 10,
            intelligence: 10
        };
        this.rebirths = 0;
        this.idleTimer = null;
        this.hasAchievedNirvana = false;

        this.syllables = this.cache.text.get('syllables').split('\n').map(s => s.trim()).filter(s => s.length > 0);

        this.generateAndDisplayCreature();
        this.createUI();

        this.pooGroup = this.add.group();
        this.updatePooPiles();
        this.resetIdleTimer();

        this.powerupGroup = this.add.group();
        this.time.addEvent({
            delay: 7000,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });
    }

    spawnPowerup() {
        const powerupTypes = [
            { key: 'powerup_book', stat: 'intelligence', amount: 15 },
            { key: 'powerup_soap', stat: 'hygiene', amount: 15 },
            { key: 'powerup_barbell', stat: 'muscle', amount: 15 },
            { key: 'powerup_controller', stat: 'fun', amount: 15 }
        ];

        const type = Phaser.Math.RND.pick(powerupTypes);
        const x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
        const y = Phaser.Math.Between(250, this.sys.game.config.height - 150);

        const powerup = this.powerupGroup.create(x, y, type.key);
        powerup.setInteractive();

        powerup.on('pointerdown', () => {
            this.increaseStat(type.stat, type.amount);
            this.showFloatingText(`+${type.amount}`, powerup.x, powerup.y);
            powerup.destroy();
        });

        this.time.delayedCall(5000, () => {
            if (powerup.active) {
                powerup.destroy();
            }
        });
    }

    createUI() {
        this.createStatDisplays();
        this.createScreenshotButton();

        this.nameTag = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 100,
            `My name is ${this.creature.creatureName}`,
            {
                fontSize: '24px',
                color: '#000000',
                align: 'center',
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        const buttonY = this.sys.game.config.height - 60;
        const buttonPositions = {
            feed: this.sys.game.config.width * 0.2,
            play: this.sys.game.config.width * 0.4,
            clean: this.sys.game.config.width * 0.6,
            study: this.sys.game.config.width * 0.8
        };

        this.feedButton = this.createButton(buttonPositions.feed, buttonY, 'FoodButton');
        this.playButton = this.createButton(buttonPositions.play, buttonY, 'PlayButton');
        this.cleanButton = this.createButton(buttonPositions.clean, buttonY, 'SoapButton');
        this.studyButton = this.createButton(buttonPositions.study, buttonY, 'StudyButton');

        const buttons = [
            { button: this.feedButton, stat: 'muscle' },
            { button: this.playButton, stat: 'fun' },
            { button: this.cleanButton, stat: 'hygiene' },
            { button: this.studyButton, stat: 'intelligence' }
        ];

        buttons.forEach(({ button, stat }) => {
            button.on('pointerdown', () => {
                if (this.statIncreaseTimer) {
                    this.statIncreaseTimer.remove();
                }
                this.increaseStat(stat);
                this.showFloatingText('+1', button.x, button.y - 50);

                this.statIncreaseTimer = this.time.addEvent({
                    delay: 500,
                    callback: () => {
                        this.increaseStat(stat, 20);
                        this.showFloatingText('+1', button.x, button.y - 50);
                    },
                    callbackScope: this,
                    loop: true
                });
            });

            const stopTimer = () => {
                if (this.statIncreaseTimer) {
                    this.statIncreaseTimer.remove();
                    this.statIncreaseTimer = null;
                }
            };

            button.on('pointerup', stopTimer);
            button.on('pointerout', stopTimer);
        });
    }

    increaseStat(stat, amount = 1) {
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

    createButton(x, y, key) {
        const button = this.add.sprite(x, y, key).setInteractive();
        button.setScale(0.2);
        return button;
    }

    showFloatingText(text, x, y) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    createStatDisplays() {
        this.statBars = {};
        const statY1 = 50;
        const statY2 = 150;

        this.statBars.hygiene = this.createStatBar(200, statY1, 'Hygiene', this.stats.hygiene);
        this.statBars.fun = this.createStatBar(200, statY2, 'Fun', this.stats.fun);
        this.statBars.muscle = this.createStatBar(this.sys.game.config.width - 200, statY1, 'Muscle', this.stats.muscle);
        this.statBars.intelligence = this.createStatBar(this.sys.game.config.width - 200, statY2, 'Intelligence', this.stats.intelligence);

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
        const eyeOptions = ['creature_eyes_1', 'creature_eyes_2', 'creature_eyes_3', 'creature_eyes_4'];
        const mouthOptions = ['creature_mouth_1', 'creature_mouth_2', 'creature_mouth_3', 'creature_mouth_4', 'creature_mouth_5'];
        const bodyRadius = 75;

        const limbConfigs = [];
        const numLimbs = Phaser.Math.Between(2, 30);
        for (let i = 0; i < numLimbs; i++) {
            const hasMouth = Phaser.Math.RND.frac() < 0.25;
            limbConfigs.push({
                x: Math.cos(Phaser.Math.DegToRad(i * (360 / numLimbs))) * bodyRadius,
                y: Math.sin(Phaser.Math.DegToRad(i * (360 / numLimbs))) * bodyRadius,
                angle: Phaser.Math.Between(0, 360),
                hasMouth: hasMouth,
                mouthKey: hasMouth ? Phaser.Math.RND.pick(mouthOptions) : null
            });
        }

        const eyeConfigs = [];
        const numEyes = Phaser.Math.Between(1, 24);
        for (let i = 0; i < numEyes; i++) {
            eyeConfigs.push({
                x: Phaser.Math.Between(-35, 35),
                y: Phaser.Math.Between(-30, 0),
                key: Phaser.Math.RND.pick(eyeOptions)
            });
        }

        const mouthConfigs = [];
        const numMouths = Phaser.Math.Between(1, 6);
        for (let i = 0; i < numMouths; i++) {
            mouthConfigs.push({
                x: Phaser.Math.Between(-20, 20),
                y: Phaser.Math.Between(10, 35),
                key: Phaser.Math.RND.pick(mouthOptions)
            });
        }

        this.creature = new Creature(
            this,
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.generateRandomName(),
            bodyKey,
            limbConfigs,
            eyeConfigs,
            mouthConfigs
        );
    }

    update() {
        if (this.hasAchievedNirvana) {
            return;
        }
        this.checkCreatureMood();
        this.checkForRebirth();
    }

    checkForRebirth() {
        for (const stat in this.stats) {
            if (this.stats[stat] >= 100) {
                this.triggerRebirth();
                break;
            }
        }
    }

    triggerRebirth() {
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

        this.rebirths++;
        this.rebirthText.setText(`Rebirths: ${this.rebirths}`);

        if (this.rebirths >= 100) {
            this.hasAchievedNirvana = true;
            this.cameras.main.setBackgroundColor('#90EE90');
            this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Achieved Nirvana', {
                fontSize: '64px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            this.time.removeAllEvents();
            this.creature.setVisible(false);
            this.powerupGroup.clear(true, true);
            this.pooGroup.clear(true, true);
            return;
        }

        for (const stat in this.stats) {
            this.stats[stat] = 1;
        }

        for (const stat in this.statBars) {
            this.statBars[stat].update(this.stats[stat]);
        }

        this.creature.destroy();
        this.generateMutableCreatureAssets();
        this.generateAndDisplayCreature();
        this.nameTag.setText(`My name is ${this.creature.creatureName}`);
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
            const blob = await this.imageToBlob(image);
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Image copied to clipboard.');
            const feedbackText = this.add.text(this.sys.game.config.width / 2, 50, 'Copied to clipboard!', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => feedbackText.destroy());
        } catch (err) {
            console.error('Failed to copy image: ', err);
            const feedbackText = this.add.text(this.sys.game.config.width / 2, 50, 'Failed to copy image.', { fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => feedbackText.destroy());
        }
    }

    imageToBlob(image) {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
        });
    }
}
