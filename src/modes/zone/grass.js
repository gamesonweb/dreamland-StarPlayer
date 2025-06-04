let gameOver = false;
let playerAlive = true;

async function createGrassScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    createFreeCamera(scene, canvas);
    await havokPhysics(scene);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    setupInput(scene);

    // Variables globales à la scène
    const playerState = {
        playerMesh: null,
        playerAnimations: null,
    };

    let currentCharacter = null;
    let currentWeapon = null;
    let maxShots = 3;
    let currentShots = maxShots;
    let lastShotTime = 0;
    let autoReloading = false;
    let reloadIntervalId = null;

    const projectiles = [];
    const teams = { red: [], blue: [] };

    // Initialise le rechargement automatique des munitions
    function startAutoReload() {
        if (autoReloading) return;
        autoReloading = true;
        reloadIntervalId = setInterval(() => {
            if (currentShots < maxShots) {
                currentShots++;
                updateAmmoBar();
            }
        }, 2000);
    }

    // Met à jour la barre de munitions affichée
    function updateAmmoBar() {
        if (playerState && playerState.ammoBar) {
            playerState.ammoBar.update(currentShots, maxShots);
        }
    }

    // Fonction de tir gérée par la scène
    scene.shoot = () => {
        if (!currentCharacter || !currentWeapon) return;

        const now = Date.now();
        const cooldown = 500;

        if (now - lastShotTime < cooldown) return;

        if (currentShots >= 1) {
            const numProjectiles = currentCharacter.NumberAmmoPerShoot;
            for (let i = 0; i < numProjectiles; i++) {
                setTimeout(() => {
                    const projectile = currentWeapon.fire(inputStates);
                    if (projectile) {
                        projectiles.push(projectile);
                    }
                }, i * 50);
            }
            currentShots--;
            updateAmmoBar();
            lastShotTime = now;
        }
    };

    function createTeams(playerCharacter) {
        const allChars = getCharacters();

        function getRandomChars(arr, count) {
            const copy = [...arr];
            const result = [];
            for (let i = 0; i < count; i++) {
                if (copy.length === 0) break;
                const idx = Math.floor(Math.random() * copy.length);
                result.push(copy.splice(idx, 1)[0]);
            }
            return result;
        }

        const redClonesChars = getRandomChars(allChars.filter(c => c.name !== playerCharacter.name), 3);
        const blueClonesChars = getRandomChars(allChars.filter(c => c.name !== playerCharacter.name), 2);

        return {
            red: [
                { name: "RedClone1", isPlayer: false, character: redClonesChars[0], color: "red", position: new BABYLON.Vector3(0, 0, -32) },
                { name: "RedClone2", isPlayer: false, character: redClonesChars[1], color: "red", position: new BABYLON.Vector3(-2, 0, -32) },
                { name: "RedClone3", isPlayer: false, character: redClonesChars[2], color: "red", position: new BABYLON.Vector3(-4, 0, -32) }
            ],
            blue: [
                { name: "playerMesh", isPlayer: true, character: playerCharacter, color: "blue", position: new BABYLON.Vector3(0, 0, 32) },
                { name: "BlueClone2", isPlayer: false, character: blueClonesChars[0], color: "blue", position: new BABYLON.Vector3(2, 0, 32) },
                { name: "BlueClone3", isPlayer: false, character: blueClonesChars[1], color: "blue", position: new BABYLON.Vector3(4, 0, 32) }
            ]
        };
    }

    
    // Charge les assets du décor (map)
    function loadMap(assetsManager, scene) {
        const mapTask = assetsManager.addMeshTask("map task", "", "./public/models/map/", "Dueling-Beetles.glb");
        mapTask.onSuccess = (task) => {
            task.loadedMeshes.forEach(mesh => {
                if (mesh.getTotalVertices() > 0) {
                    if (mesh.name.startsWith("Brique_") || mesh.name.startsWith("Beton_")) {
                        mesh.checkCollisions = true;
                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                            mesh,
                            BABYLON.PhysicsImpostor.MeshImpostor,
                            { mass: 0, restitution: 0 },
                            scene
                        );
                    }
                }
            });
        };
    }

    // Charge les personnages de chaque équipe et configure leur comportement
    function loadTeamsAssets(assetsManager, predefinedTeams, scene, teams) {
        for (const teamName in predefinedTeams) {
            for (const member of predefinedTeams[teamName]) {
                const task = assetsManager.addMeshTask(`${member.name}Task`, "", member.character.modelPath, member.character.modelFile);

                task.onSuccess = (task) => {
                    const mesh = task.loadedMeshes[0];
                    mesh.name = member.name;
                    mesh.team = teamName;
                    mesh.isPlayer = member.isPlayer;
                    mesh.checkCollisions = true;
                    mesh.position = member.position.clone();
                    if (teamName === "red") {
                        mesh.rotationQuaternion = null;
                        mesh.rotation.y = Math.PI; // 180°
                    }
                    mesh.spawnPosition = mesh.position.clone();

                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        mesh,
                        BABYLON.PhysicsImpostor.BoxImpostor,
                        { mass: 0 },
                        scene
                    );

                    normalizeMeshHeight(mesh, 2);
                    mesh.Hp = member.character.maxHP;
                    mesh.maxHp = member.character.maxHP;

                    mesh.hpGui = createHPBar(scene, { mesh: mesh }, gui);
                    mesh.updateHpBar = updateHpBar.bind(mesh);

                    mesh.animations = task.loadedAnimationGroups;

                    if (member.isPlayer) {
                        playerState.playerMesh = mesh;
                        playerState.playerAnimations = mesh.animations;

                        // Le reste inchangé :
                        mesh.camera = createFollowCamera(scene, mesh);
                        scene.activeCamera = mesh.camera;

                        const gunMesh = mesh.getChildMeshes().find(m => m.name.toLowerCase().includes("gun"));
                        currentWeapon = new FireGun(gunMesh ?? mesh, mesh, scene);

                        mesh.ammoBar = createAmmoBar(scene, { mesh: mesh }, gui);
                        mesh.ammoBar.update(currentShots, maxShots);

                        startAutoReload();
                        updateAmmoBar();
                    } else {
                        const enemies = teamName === "red" ? teams.blue : teams.red;
                        addCloneAI(mesh, enemies, scene, teamName, projectiles, teams);
                    }

                    teams[teamName].push(mesh);
                };
            }
        }
    }

    // Logique principale de déplacement, tir et animations du joueur
    function setupGameLoop(scene, playerState, zoneController, progressBars) {
        scene.onBeforeRenderObservable.add(() => {
            const playerMesh = playerState.playerMesh;
            const playerAnimations = playerState.playerAnimations;
            if (!playerMesh) return;
            if (!playerAlive || gameOver) return;

            let moveSpeed = 0.1;
            let rotationSpeed = 0.03;
            let moved = false;

            if (inputStates.left) {
                playerMesh.rotate(BABYLON.Vector3.Up(), -rotationSpeed);
                moved = true;
            }
            if (inputStates.right) {
                playerMesh.rotate(BABYLON.Vector3.Up(), rotationSpeed);
                moved = true;
            }
            if (inputStates.up) {
                let forward = new BABYLON.Vector3(0, 0, 1);
                let direction = BABYLON.Vector3.TransformCoordinates(forward, playerMesh.getWorldMatrix()).subtract(playerMesh.position);
                direction.y = 0;
                direction.normalize();
                playerMesh.moveWithCollisions(direction.scale(moveSpeed));
                moved = true;
            }
            if (inputStates.down) {
                let backward = new BABYLON.Vector3(0, 0, -1);
                let direction = BABYLON.Vector3.TransformCoordinates(backward, playerMesh.getWorldMatrix()).subtract(playerMesh.position);
                direction.y = 0;
                direction.normalize();
                playerMesh.moveWithCollisions(direction.scale(moveSpeed));
                moved = true;
            }

            if (inputStates.space && typeof scene.shoot === "function") {
                scene.shoot();
                inputStates.space = false;
            }

            if (playerMesh && playerAnimations) {
                if (inputStates.space) {
                    playAnimationByName(playerMesh, "Shoot", true);
                } else if (moved) {
                    playAnimationByName(playerMesh, "Run", true);
                } else {
                    playAnimationByName(playerMesh, "Pose", true);
                }
            }

            zoneController.update();

            const scores = zoneController.getScores();
            progressBars.update(scores.red, scores.blue, 100);
        });
    }

    // --- DÉBUT DE LA LOGIQUE PRINCIPALE ---

    const character = getSelectedCharacter();
    currentCharacter = character;

    const predefinedTeams = createTeams(character);

    const zoneController = setupZoneControl(scene, teams);
    const progressBars = createProgressBars(scene);
    createGameTimerUI(scene, zoneController);

    const assetsManager = new BABYLON.AssetsManager(scene);
    loadMap(assetsManager, scene);
    loadTeamsAssets(assetsManager, predefinedTeams, scene, teams);

    assetsManager.load();

    setupGameLoop(scene, playerState, zoneController, progressBars);

    return scene;
}

// Fonction pour mettre à jour la barre de vie
function updateHpBar() {
    const ratio = Math.max(this.Hp / this.maxHp, 0);
    this.hpGui.hpBarFill.width = ratio;
    this.hpGui.hpFloatingText.text = this.Hp.toString();
    this.hpGui.hpBarFill.background = ratio <= 0.3 ? "red" : "green";
}

// Fonction pour jouer une animation sur un mesh
function playAnimationByName(mesh, name, loop = true) {
    if (!mesh.animations || mesh.currentAnim === name) return;

    mesh.animations.forEach(anim => anim.stop());

    const animToPlay = mesh.animations.find(anim => anim.name.includes(name));
    if (animToPlay) {
        animToPlay.start(loop);
        mesh.currentAnim = name;
    }
}
