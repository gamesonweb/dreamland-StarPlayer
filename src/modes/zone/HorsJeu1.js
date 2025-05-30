async function createHorsJeu1Scene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);
    await havokPhysics(scene);
    createFreeCamera(scene, canvas);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    setupInput(scene);
    createGround(scene);

    character = getSelectedCharacter();

    await createGround(scene);
    scene.tank = await createTank(scene, character);
    createHeroDude(scene, character.modelFile);


    // Ajoute ça pour animer ton tank
    scene.onBeforeRenderObservable.add(() => {
        if (scene.tank && !scene.tank.isDead) {
            scene.tank.move();
        }
    });
    // Initialisation des équipes
    const teams = {
        red: [],
        blue: []
    };
    const zoneController = setupZoneControl(scene, teams);
    createGameTimerUI(scene, zoneController);

    return scene;
}

function createGround(scene) {
    return new Promise((resolve, reject) => {
        const assetsManager = new BABYLON.AssetsManager(scene);
        const herbeMat = new BABYLON.StandardMaterial("herbeMat", scene);
        herbeMat.diffuseColor = BABYLON.Color3.FromHexString("#34c759"); // Vert clair
        const mapTask = assetsManager.addMeshTask("map task", "", "./public/models/map/", "MapStarPlayerHorsJeu1.glb");
        mapTask.onSuccess = (task) => {
            task.loadedMeshes.forEach(mesh => {
                if (mesh.name.includes("Herbes1") || mesh.name.includes("Maillage")) {
                    mesh.checkCollisions = false;
                    mesh.isPickable = false;
                } else {
                    mesh.checkCollisions = true;
                    mesh.isPickable = true;
                    const shape = new BABYLON.PhysicsShapeMesh(mesh, scene);
                    const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.STATIC, false, scene);
                    body.shape = shape;
                }
            });

            let groundMesh = task.loadedMeshes.find(m => m.name.includes("Plan.007"));
            if (groundMesh) {
                const size = 512;
                const squares = 33;
                const texture = new BABYLON.DynamicTexture("dynamicChecker", size, scene, true);
                const ctx = texture.getContext();
                const squareSize = size / squares;
                const color1 = "#e1c08d";
                const color2 = "#b28850";

                for (let y = 0; y < squares; y++) {
                    for (let x = 0; x < squares; x++) {
                        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
                        ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
                    }
                }

                texture.update();

                const checkerMaterial = new BABYLON.StandardMaterial("checkerMat", scene);
                checkerMaterial.diffuseTexture = texture;
                checkerMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
                checkerMaterial.backFaceCulling = false;

                groundMesh.material = checkerMaterial;
            }

            // Rotation globale de la racine
            if (task.loadedMeshes.length > 0) {
                let root = task.loadedMeshes[0];
                root.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                scene.ground = root;
            }
            resolve();
        };

        mapTask.onError = (task, message, exception) => {
            console.error("Erreur de chargement de la map:", message, exception);
        };

        assetsManager.load();
    });
    }

function createTank(scene, character ) {
    return new Promise((resolve, reject) => {
        const assetsManager = new BABYLON.AssetsManager(scene);
        const tankTask = assetsManager.addMeshTask("character task", "", character.modelPath, character.modelFile);
        tankTask.onSuccess = (task) => {
            tank = task.loadedMeshes[0];
            tank.name = "tank";
            tank.position = new BABYLON.Vector3(0, 0.6, 0); // Position initiale
            normalizeMeshHeight(tank, 2);
            tank.checkCollisions = true;
            tank.speed = 0.1; // Vitesse de déplacement

            character.mesh = tank; // Associer le mesh du tank au personnage
            tank.hpMax = character.maxHP; // définit les PV max du tank
            tank.hp = tank.hpMax;         // initialise les PV actuels à la valeur max

            tank.frontVector = new BABYLON.Vector3(0, 0, 1); // vers l’avant

            scene.activeCamera = createFollowCamera(scene, tank);
            tank.move = function () {
                if (this.isDead) return;
                if (inputStates.up) {
                    this.moveWithCollisions(this.frontVector.multiplyByFloats(-this.speed, -this.speed, this.speed));
                }
                if (inputStates.down) {
                    this.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed, this.speed, -this.speed));
                }
                if (inputStates.left) {
                    const left = new BABYLON.Vector3(-this.frontVector.z, 0, -this.frontVector.x).normalize();
                    this.moveWithCollisions(left.scale(this.speed));
                }
                if (inputStates.right) {
                    const right = new BABYLON.Vector3(this.frontVector.z, 0, this.frontVector.x).normalize();
                    this.moveWithCollisions(right.scale(this.speed));
                }
                this.rotation.y = Math.atan2(this.frontVector.x, this.frontVector.z);
            };

            tank.canFire = true;
            tank.fireAfter = 0.3;

            tank.fire = function () {
                if (this.isDead || !inputStates.space || !this.canFire) return;
                this.canFire = false;

                setTimeout(() => this.canFire = true, 1000 * this.fireAfter);

                let cannonball = BABYLON.MeshBuilder.CreateSphere("cannonball", {diameter: 0.5}, scene);
                cannonball.material = new BABYLON.StandardMaterial("Fire", scene);
                cannonball.material.diffuseTexture = new BABYLON.Texture("images/Fire.jpg", scene);

                cannonball.position = this.position.add(this.frontVector.scale(5));

                let speed = 1;
                let direction = this.frontVector.clone();
                let maxDistance = 25;
                let traveled = 0;

                scene.onBeforeRenderObservable.add(() => {
                    if (!cannonball) return;

                    let movement = direction.scale(speed);
                    cannonball.position.addInPlace(movement);
                    traveled += speed;

                    // Collision avec les dudes
                    for (let dude of scene.dudes) {
                        if (dude.isDead) continue;
                        const dist = BABYLON.Vector3.Distance(cannonball.position, dude.position);
                        if (dist < 2) {
                            dude.hp -= 5;
                            dude.updateHpBar();
                            if (dude.hp <= 0) {
                                dude.die();
                            }
                            cannonball.dispose();
                            cannonball = null;
                            return;
                        }
                    }

                    if (traveled > maxDistance) {
                        cannonball.dispose();
                        cannonball = null;
                    }
                });

            };

            tank.hpGui = createHPBar(scene, tank);

            tank.updateHpBar = function () {
                const ratio = Math.max(this.hp / this.hpMax, 0);
                this.hpGui.hpBarFill.width = ratio;
                this.hpGui.hpFloatingText.text = this.hp.toString();
                this.hpGui.hpBarFill.background = ratio <= 0.3 ? "red" : "green";
            };

            tank.updateHpBar();


            tank.die = function () {
                this.isDead = true;
                this.setEnabled(false); // Masquer le tank
                this.hp = 0;
                this.updateHpBar();
                this.hpGui.hpFloatingText.isVisible = false; // Effacer le texte des HP

                // Retirer la barre de vie
                this.hpGui.hpBarContainer.isVisible = false;

                const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("deathGui");
                // Créer un texte de mort avec décompte
                const deathText = new BABYLON.GUI.TextBlock("deathText");
                deathText.color = "white";
                deathText.fontSize = 24;
                deathText.top = "-30%";
                gui.addControl(deathText);

                let timeLeft = 5;
                deathText.text = `💀 Tank détruit ! Respawn dans ${timeLeft}s...`;

                const intervalId = setInterval(() => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        deathText.text = `💀 Tank détruit ! Respawn dans ${timeLeft}s...`;
                    } else {
                        clearInterval(intervalId);
                        deathText.dispose();
                        this.respawn();
                    }
                }, 1000);
            };


            tank.respawn = function () {
                // Réinitialise la vie
                this.hp = this.hpMax;
                this.updateHpBar();
                this.hpGui.hpFloatingText.isVisible = true;

                // Position de respawn
                this.position = new BABYLON.Vector3(0, 0.6, 0); // Changer selon le besoin
                this.setEnabled(true);
                this.isDead = false;

                // Réaffiche la barre de vie
                this.hpGui.hpBarContainer.isVisible = true;
            };

            resolve(tank);
        }
        tankTask.onError = (task, message, exception) => {
            console.error("Erreur de chargement du tank :", message, exception);
        };
        assetsManager.load();
    });
}



function createHeroDude(scene, characterName) {
    BABYLON.SceneLoader.ImportMesh("", "models/personnages/", characterName , scene, (meshes) => {
        let original = meshes[0]; // Racine importée

        scene.dudes = [];

        for (let i = 0; i < 3; i++) {
            let clone = original.clone("enemyDude_" + i);
            clone.position = new BABYLON.Vector3(
                Math.random() * 40 - 20,
                0.6,
                Math.random() * 40 - 20
            );
            clone.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
            clone.speed = 0.03 + Math.random() * 0.05;
            clone.frontVector = new BABYLON.Vector3(0, 0, 1);

            clone.move = function(target) {
                if (this.isDead || !target || target.isDead) return;
                let direction = target.position.subtract(this.position);
                direction.y = 0;
                this.frontVector = direction.normalize();
                this.moveWithCollisions(this.frontVector.scale(this.speed));
                this.rotation.y = Math.atan2(this.frontVector.x, this.frontVector.z);
            };

            clone.hpMax = 5600;
            clone.hp = 5600;

            clone.hpGui = createHPBar(scene, clone);

            clone.updateHpBar = function () {
                const ratio = Math.max(this.hp / this.hpMax, 0);
                this.hpGui.hpBarFill.width = ratio;
                this.hpGui.hpFloatingText.text = this.hp.toString();
                this.hpGui.hpBarFill.background = ratio < 0.3 ? "red" : "green";
            };

            clone.updateHpBar();


            clone.die = function () {
                this.isDead = true;
                this.setEnabled(false);
                this.hpGui.hpBarContainer.isVisible = false;
                this.hpGui.hpFloatingText.text = "";

                setTimeout(() => {
                    this.respawn();
                }, 5000);
            };

            clone.respawn = function () {
                this.hp = this.hpMax;
                this.updateHpBar();

                // Remettre à une position aléatoire
                this.position = new BABYLON.Vector3(0,0.6,0);
                this.setEnabled(true);
                this.isDead = false;
                this.hpGui.hpBarContainer.isVisible = true;
            };



            clone.fireCooldown = 0;

            clone.fire = function(target) {
                if (this.isDead || !target || target.isDead || this.fireCooldown > 0) return;

                const distance = BABYLON.Vector3.Distance(this.position, target.position);
                if (distance > 25) return;

                this.fireCooldown = 1;
                setTimeout(() => this.fireCooldown = 0, 1000);

                let bullet = BABYLON.MeshBuilder.CreateSphere("enemyBullet", { diameter: 0.3 }, scene);
                bullet.material = new BABYLON.StandardMaterial("enemyBulletMat", scene);
                bullet.material.diffuseColor = BABYLON.Color3.Red();
                bullet.position = this.position.add(new BABYLON.Vector3(0, 1, 0));

                const direction = target.position.subtract(this.position).normalize();
                const speed = 0.5;
                const maxDistance = 25;
                let traveled = 0;

                const renderObserver = scene.onBeforeRenderObservable.add(() => {
                    if (!bullet || !bullet.isEnabled()) return;

                    bullet.position.addInPlace(direction.scale(speed));
                    traveled += speed;

                    if (traveled > maxDistance) {
                        bullet.dispose();
                        scene.onBeforeRenderObservable.remove(renderObserver); // ✅ CORRECTEMENT SUPPRIMÉ
                        return;
                    }

                    const distToTank = BABYLON.Vector3.Distance(bullet.position, target.position);
                    if (distToTank < 2 && !target.isDead) {
                        bullet.dispose();
                        scene.onBeforeRenderObservable.remove(renderObserver); // ✅ CORRECTEMENT SUPPRIMÉ
                        target.hp -= 600; // Dégâts infligés
                        target.updateHpBar();
                        if (target.hp <= 0) {
                            target.die();
                        }
                    }
                });
            };


            scene.dudes.push(clone);
        }

        // Supprime complètement le modèle original après clonage
        original.dispose();
    });
}

function moveOtherDudes(tank) {
    if (scene.dudes) {
        for (let i = 0; i < scene.dudes.length; i++) {
            const dude = scene.dudes[i];
            dude.move(tank);
            dude.fire(tank);
        }
    }
}

function createEnemyCannonball(dude, target) {
    let cannonball = BABYLON.MeshBuilder.CreateSphere("enemyCannonball", { diameter: 0.5 }, scene);
    cannonball.material = new BABYLON.StandardMaterial("enemyFire", scene);
    cannonball.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Rouge

    cannonball.position = dude.position.add(dude.frontVector.scale(5));

    let speed = 0.6;
    let direction = target.position.subtract(dude.position).normalize();
    let maxDistance = 25;
    let traveled = 0;

    scene.onBeforeRenderObservable.add(() => {
        if (!cannonball || !cannonball.isEnabled()) return;
        let movement = direction.scale(speed);
        cannonball.position.addInPlace(movement);
        traveled += speed;
        if (traveled > maxDistance) {
            cannonball.dispose();
        }

        // Collision simple : si proche du tank, le toucher
        if (!target.isDead && BABYLON.Vector3.Distance(cannonball.position, target.position) < 1.5) {
            target.hp -= 15;
            target.updateHpBar();
            if (target.hp <= 0) target.die();
            cannonball.dispose();
        }
    });
}
