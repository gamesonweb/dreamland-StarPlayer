let gameOver = false;
let playerAlive = true;

async function createGrassScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    createFreeCamera(scene, canvas);
    await havokPhysics(scene);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    setupInput(scene);

    let playerMesh = null;
    let playerAnimations = null;
    let weapon = null;

    // Variables liées au tir et munitions
    let currentCharacter = null;
    let currentWeapon = null;
    let maxShots = 3;
    let currentShots = maxShots;
    let lastShotTime = 0;
    let autoReloading = false;
    let reloadIntervalId = null;


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

    function updateAmmoBar() {
        if (playerMesh && playerMesh.ammoBar) {
            playerMesh.ammoBar.update(currentShots, maxShots);
        }
    }

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

            currentShots -= 1;
            updateAmmoBar();
            lastShotTime = now;
        }
    };

    const character = getSelectedCharacter();
    currentCharacter = character;
    const predefinedTeams = {
        red: [
            { name: "RedClone1", isPlayer: false, character: getCharacters()[0], color: "red", position: new BABYLON.Vector3(0, 0, -32) },
            { name: "RedClone2", isPlayer: false, character: getCharacters()[1], color: "red", position: new BABYLON.Vector3(-2, 0, -32) },
            { name: "RedClone3", isPlayer: false, character: getCharacters()[2], color: "red", position: new BABYLON.Vector3(-4, 0, -32) }
        ],
        blue: [
            { name: "playerMesh", isPlayer: true, character: character, color: "blue", position: new BABYLON.Vector3(0, 0, 32) },
            { name: "BlueClone2", isPlayer: false, character: getCharacters()[1], color: "blue", position: new BABYLON.Vector3(2, 0, 32) },
            { name: "BlueClone3", isPlayer: false, character: getCharacters()[2], color: "blue", position: new BABYLON.Vector3(4, 0, 32) }
        ]
    };


    const projectiles = [];
    const teams = { red: [], blue: [] };

    const zoneController = setupZoneControl(scene, teams);
    createGameTimerUI(scene, zoneController);

    const assetsManager = new BABYLON.AssetsManager(scene);

    const mapTask = assetsManager.addMeshTask("map task", "", "models/map/", "Dueling-Beetles.glb");
    mapTask.onSuccess = (task) => {
        task.loadedMeshes.forEach(mesh => {
            if (mesh.getTotalVertices() > 0) {
                if ( mesh.name.startsWith("Brique_") || mesh.name.startsWith("Beton_")) {
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

    if (character) {
        predefinedTeams.blue[0].character = character;
    }

    for (const teamName in predefinedTeams) {
            for (const member of predefinedTeams[teamName]) {
                const task = assetsManager.addMeshTask(`${member.name}Task`, "", member.character.modelPath, member.character.modelFile);

                task.onSuccess = (task) => {
                    const mesh = task.loadedMeshes[0];
                    mesh.name = member.name;
                    mesh.isPlayer = member.isPlayer;
                    mesh.checkCollisions = true;
                    mesh.position = member.position.clone();
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

                    mesh.hpGui = createHPBar(scene, {mesh:mesh}, gui);
                    mesh.updateHpBar = updateHpBar.bind(mesh);

                    mesh.animations = task.loadedAnimationGroups;
                    if (member.isPlayer) {

                        mesh.isPlayer = true;
                        playerMesh = mesh;
                        currentCharacter = member.character;
                        playerAnimations = mesh.animations;

                        mesh.camera = createFollowCamera(scene, mesh);
                        scene.activeCamera = createFollowCamera(scene, mesh);
                        const gunMesh = mesh.getChildMeshes().find(m => m.name.toLowerCase().includes("Gun"));
                        currentWeapon = new FireGun(gunMesh ?? mesh, mesh, scene);

                        mesh.ammoBar = createAmmoBar(scene, {mesh:mesh}, gui);
                        mesh.ammoBar.update(currentShots, maxShots);

                        startAutoReload();
                        updateAmmoBar();
                    } else {
                        const enemies = teamName === "red" ? teams.blue : teams.red;
                        addCloneAI(mesh, enemies, scene, teamName, projectiles,teams);
                    }

                    teams[teamName].push(mesh);
                };
            }
        }

    assetsManager.load();
    const progressBars = createProgressBars(scene);

    scene.onBeforeRenderObservable.add(() => {
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
            // Avance dans la direction actuelle
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
            console.log("Shooting...");
            scene.shoot();
            inputStates.space = false;
        }

        if (playerMesh && playerAnimations) {
            if (inputStates.space) {
                playAnimationByName(playerMesh, "Shoot", false);
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

    return scene;
}

function updateHpBar() {
    const ratio = Math.max(this.Hp / this.maxHp, 0);
    this.hpGui.hpBarFill.width = ratio;
    this.hpGui.hpFloatingText.text = this.Hp.toString();
    this.hpGui.hpBarFill.background = ratio <= 0.3 ? "red" : "green";
}
function playAnimationByName(mesh, name, loop = true) {
    if (!mesh.animations || mesh.currentAnim === name) return;

    // Stop all other animations
    mesh.animations.forEach(anim => anim.stop());

    const animToPlay = mesh.animations.find(anim => anim.name.includes(name));
    if (animToPlay) {
        animToPlay.start(loop);
        mesh.currentAnim = name;
    }
}
