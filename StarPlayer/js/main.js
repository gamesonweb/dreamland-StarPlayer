let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};

window.onload = startGame;

async function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    
    const { scene: createdScene, tank } = await createScene();
    scene = createdScene;

    scene.enablePhysics();
    modifySettings();

    engine.runRenderLoop(() => {
        tank.move();
        tank.fire();
        moveOtherDudes(tank);
        tank.updateHpBar();
        scene.render();
    });
    
}


async function createScene() {
    let scene = new BABYLON.Scene(engine);

    // ✅ Activer la physique tout de suite après la création de la scène
    scene.enablePhysics();

    let ground = createGround(scene);
    let freeCamera = createFreeCamera(scene);
    let tank = await createTank(scene); // tank utilise la physique pour les cannonballs

    let followCamera = createFollowCamera(scene, tank);
    scene.activeCamera = followCamera;

    createLights(scene);
    createHeroDude(scene);

    return { scene, tank };
}



function createGround(scene) {
    const herbeMat = new BABYLON.StandardMaterial("herbeMat", scene);
    herbeMat.diffuseColor = BABYLON.Color3.FromHexString("#34c759"); // Vert clair

    BABYLON.SceneLoader.ImportMesh(null, "models/", "MapStarPlayerHorsJeu1.glb", scene, function (meshes) {
        meshes.forEach(mesh => {
            console.log("Nom du mesh :", mesh.name); // Debug

            // Exclure les mesh qui contiennent "Herbes1"
            if (mesh.name.includes("Herbes1") || mesh.name.includes("Maillage")) {
                mesh.checkCollisions = false;
                mesh.isPickable = false;
                if (mesh.physicsImpostor) mesh.physicsImpostor.dispose();
            } else {
                mesh.checkCollisions = true;
                mesh.isPickable = true;

                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                    mesh,
                    BABYLON.PhysicsImpostor.MeshImpostor,
                    { mass: 0, restitution: 0.1, friction: 0.8 },
                    scene
                );
            }
        });

        let groundMesh = meshes.find(mesh => mesh.name.includes("Plan.007"));
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

        // Réglage de la rotation globale
        let root = meshes[0];
        root.rotation = new BABYLON.Vector3(0, Math.PI / 1, 0);
        scene.ground = root;
    });
}


function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-1, -1, 0), scene);

}

function createFreeCamera(scene) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 50, 0), scene);
    camera.attachControl(canvas);
    camera.checkCollisions = true;
    camera.applyGravity = true;

    // Support both AZERTY (ZQSD) and QWERTY (WASD)
    const keysUp = ['z', 'Z', 'w', 'W'];
    const keysDown = ['s', 'S'];
    const keysLeft = ['q', 'Q', 'a', 'A'];
    const keysRight = ['d', 'D'];

    keysUp.forEach(k => camera.keysUp.push(k.charCodeAt(0)));
    keysDown.forEach(k => camera.keysDown.push(k.charCodeAt(0)));
    keysLeft.forEach(k => camera.keysLeft.push(k.charCodeAt(0)));
    keysRight.forEach(k => camera.keysRight.push(k.charCodeAt(0)));

    return camera;
}


function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("tankFollowCamera", target.position, scene, target);

    camera.radius = 40; // how far from the object to follow
	camera.heightOffset = 40; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

    return camera;
}

function createTank(scene) {
    return new Promise((resolve) => {
        BABYLON.SceneLoader.ImportMesh("", "models/", "colt_player_geo.glb", scene, (meshes) => {
            let tank = meshes[0];
            tank.name = "heroTank";
            tank.position = new BABYLON.Vector3(0, 0.6, 0);
            tank.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
            tank.speed = 0.2;
            tank.frontVector = new BABYLON.Vector3(0, 0, -1);

            // === Initialise les HP ===
            tank.hpMax = 100;
            tank.hp = 100;

            tank.move = function() {
                if (this.isDead) return;
                if(inputStates.up) {
                    this.moveWithCollisions(this.frontVector.multiplyByFloats(-this.speed, -this.speed, this.speed));
                }    
                if(inputStates.down) {
                    this.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed, this.speed, -this.speed));
                }    
                if(inputStates.left) {
                    const left = new BABYLON.Vector3(-this.frontVector.z, 0, -this.frontVector.x).normalize();
                    this.moveWithCollisions(left.scale(this.speed));
                }
                if(inputStates.right) {
                    const right = new BABYLON.Vector3(this.frontVector.z, 0, this.frontVector.x).normalize();
                    this.moveWithCollisions(right.scale(this.speed));
                }
                this.rotation.y = Math.atan2(this.frontVector.x, this.frontVector.z);
            };

            tank.canFire = true;
            tank.fireAfter = 0.3;

            tank.fire = function() {
                if (this.isDead || !inputStates.space || !this.canFire) return;
                this.canFire = false;

                setTimeout(() => this.canFire = true, 1000 * this.fireAfter);

                let cannonball = BABYLON.MeshBuilder.CreateSphere("cannonball", { diameter: 0.5 }, scene);
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

            // Crée une interface GUI attachée à la scène
            const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

            // Crée une barre de vie GUI
            const hpBarContainer = new BABYLON.GUI.Rectangle();
            hpBarContainer.width = "60px";
            hpBarContainer.height = "10px";
            hpBarContainer.cornerRadius = 5;
            hpBarContainer.color = "white";
            hpBarContainer.thickness = 1;
            hpBarContainer.background = "grey";
            gui.addControl(hpBarContainer);


            // Crée un texte pour afficher les HP
            const hpText = new BABYLON.GUI.TextBlock();
            hpText.text = tank.hp + " / " + tank.hpMax;
            hpText.color = "white";
            hpText.fontSize = "14px";
            hpText.top = "-25px"; // Position au-dessus de la barre de vie
            hpText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            hpText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            hpBarContainer.addControl(hpText);


            const hpBarFill = new BABYLON.GUI.Rectangle();
            hpBarFill.width = 1; // 1 = 100%
            hpBarFill.height = "100%";
            hpBarFill.background = "green";
            hpBarFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            hpBarContainer.addControl(hpBarFill);

            // Positionner la barre de vie au-dessus du tank
            hpBarContainer.linkWithMesh(tank);
            hpBarContainer.linkOffsetY = -65; // Décalage au-dessus du personnage

            tank.updateHpBar = function () {
                const ratio = Math.max(this.hp / this.hpMax, 0);
                hpBarFill.width = ratio;
                hpText.text = this.hp + " / " + this.hpMax;

                // Change la couleur selon le ratio
                if (ratio <= 0.3) {
                    hpBarFill.background = "red";
                } else {
                    hpBarFill.background = "green";
                }
            };

            
            tank.updateHpBar();
            

            tank.die = function () {
                this.isDead = true;
                this.setEnabled(false); // Masquer le tank
                this.hp = 0;
                this.updateHpBar();
                inputStates = {}; // désactive les mouvements
            
                // Retirer la barre de vie
                hpBarContainer.isVisible = false;
            
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
            
                // Position de respawn
                this.position = new BABYLON.Vector3(0, 0.6, 0); // Changer selon le besoin
                this.setEnabled(true);
                this.isDead = false;
            
                // Réaffiche la barre de vie
                hpBarContainer.isVisible = true;
            };
            


            resolve(tank);
        });
    });
}




function createHeroDude(scene) {
    BABYLON.SceneLoader.ImportMesh("", "models/", "colt_player_geo.glb", scene, (meshes, particleSystems, skeletons) => {
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

            clone.hpMax = 20;
            clone.hp = 20;

            // Créer l'interface GUI
            const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

            // Conteneur de la barre de vie
            const hpBarContainer = new BABYLON.GUI.Rectangle();
            hpBarContainer.width = "50px";
            hpBarContainer.height = "8px";
            hpBarContainer.cornerRadius = 4;
            hpBarContainer.color = "white";
            hpBarContainer.thickness = 1;
            hpBarContainer.background = "grey";
            gui.addControl(hpBarContainer);

            // Barre de remplissage
            const hpBarFill = new BABYLON.GUI.Rectangle();
            hpBarFill.width = 1;
            hpBarFill.height = "100%";
            hpBarFill.background = "green";
            hpBarFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            hpBarContainer.addControl(hpBarFill);

            // Lier la barre de vie au mesh du dude
            hpBarContainer.linkWithMesh(clone);
            hpBarContainer.linkOffsetY = -60;

            // Fonction de mise à jour de la barre
            clone.updateHpBar = function () {
                const ratio = Math.max(this.hp / this.hpMax, 0);
                hpBarFill.width = ratio;
                hpBarFill.background = ratio < 0.3 ? "red" : "green";
            };
            clone.updateHpBar();

            
            clone.die = function () {
                this.isDead = true;
                this.setEnabled(false);
                hpBarContainer.isVisible = false;
            
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
                hpBarContainer.isVisible = true;
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
                const maxDistance = 30;
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
                        target.hp -= 1;
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




window.addEventListener("resize", () => {
    engine.resize()
});

function modifySettings() {
    scene.onPointerDown = () => {
        if (!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    };

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        scene.alreadyLocked = !!element;
    });

    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;

    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key === "arrowleft" || key === "q" || key === "a") {
            inputStates.left = true;
        } else if (key === "arrowup" || key === "z" || key === "w") {
            inputStates.up = true;
        } else if (key === "arrowright" || key === "d") {
            inputStates.right = true;
        } else if (key === "arrowdown" || key === "s") {
            inputStates.down = true;
        } else if (event.key === " ") {
            inputStates.space = true;
        }
    }, false);

    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key === "arrowleft" || key === "q" || key === "a") {
            inputStates.left = false;
        } else if (key === "arrowup" || key === "z" || key === "w") {
            inputStates.up = false;
        } else if (key === "arrowright" || key === "d") {
            inputStates.right = false;
        } else if (key === "arrowdown" || key === "s") {
            inputStates.down = false;
        } else if (event.key === " ") {
            inputStates.space = false;
        }
    }, false);
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
