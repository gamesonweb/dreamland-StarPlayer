import { FireGun } from "../../weapon";

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
                        projectiles.push(projectile); // ✅ on stocke le projectile
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

    const projectiles = [];
    const teams = { red: [], blue: [] };

    const zoneController = setupZoneControl(scene, teams);
    createGameTimerUI(scene, zoneController);

    const assetsManager = new BABYLON.AssetsManager(scene);

    const mapTask = assetsManager.addMeshTask("map task", "", "models/map/", "Dueling-Beetles.glb");
    mapTask.onSuccess = (task) => {
        task.loadedMeshes.forEach(mesh => {
            if (mesh.getTotalVertices() > 0) {
                if (mesh.name === "Sol" || mesh.name.startsWith("Brique_") || mesh.name.startsWith("Beton_")) {
                    mesh.checkCollisions = true;
                    new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.3 }, scene);
                }
            }
        });
    };

    if (character) {
        const characterTask = assetsManager.addMeshTask("character task", "", character.modelPath, character.modelFile);
        characterTask.onSuccess = (task) => {
            playerMesh = task.loadedMeshes[0];
            playerMesh.name = "PlayerMesh";
            playerMesh.checkCollisions = true;
            playerMesh.position = new BABYLON.Vector3(0, 0, 32);
            normalizeMeshHeight(playerMesh, 2);
            playerAnimations = task.loadedAnimationGroups;

            scene.activeCamera = createFollowCamera(scene, playerMesh);
            character.mesh = playerMesh;
            playerMesh.Hp = character.maxHP;
            playerMesh.maxHp = character.maxHP;



            playerMesh.hpGui = createHPBar(scene, { mesh: playerMesh }, gui);
            playerMesh.updateHpBar = updateHpBar.bind(playerMesh);

            playerMesh.ammoBar = createAmmoBar(scene, { mesh: playerMesh }, gui);
            playerMesh.ammoBar.update(currentShots, maxShots);

            

            const gunMesh = task.loadedMeshes.find(m => m.name.includes("Gun")) || task.loadedMeshes[0];

            switch (character.weaponType) {
                case "gun":
                    currentWeapon = new FireGun(gunMesh, playerMesh, scene);
                    break;
                case "sword":
                    currentWeapon = new Sword(playerMesh, scene);
                    break;
                default:
                    console.warn("Type d'arme inconnu :", character.weaponType);
            }

            startAutoReload();
            updateAmmoBar();

            teams.blue.push(playerMesh);

            for (let i = 0; i < 2; i++) {
                const clone = playerMesh.clone(`blueClone${i}`);
                clone.position = playerMesh.position.add(new BABYLON.Vector3(i + 1, 0, 0));
                teams.blue.push(clone);
                addCloneAI(clone, teams.red, scene, "blue", projectiles);
                clone.hpGui = createHPBar(scene, { mesh: clone }, gui);
                clone.updateHpBar = updateHpBar.bind(clone);
            }

            teams.red.forEach(clone => {
                new BABYLON.PhysicsAggregate(clone, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
            });
            

            for (let i = 0; i < 3; i++) {
                const clone = playerMesh.clone(`redClone${i}`);
                clone.position = playerMesh.position.add(new BABYLON.Vector3(-i - 1, 0, -40));
                teams.red.push(clone);
                addCloneAI(clone, teams.blue, scene, "red", projectiles);
                clone.hpGui = createHPBar(scene, clone);
                clone.updateHpBar = updateHpBar.bind(clone);
            }
        };
    }

    assetsManager.load();
    const progressBars = createProgressBars(scene);

    scene.onBeforeRenderObservable.add(() => {
        if (!playerMesh) return;

        const moveSpeed = 0.1;
        let moved = false;

        if (inputStates.left) {
            playerMesh.moveWithCollisions(new BABYLON.Vector3(moveSpeed, 0, 0));
            playerMesh.rotation.y = Math.PI / 2;
            moved = true;
        }
        if (inputStates.right) {
            playerMesh.moveWithCollisions(new BABYLON.Vector3(-moveSpeed, 0, 0));
            playerMesh.rotation.y = -Math.PI / 2;
            moved = true;
        }
        if (inputStates.up) {
            playerMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, -moveSpeed));
            playerMesh.rotation.y = 0;
            moved = true;
        }
        if (inputStates.down) {
            playerMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, moveSpeed));
            playerMesh.rotation.y = Math.PI;
            moved = true;
        }
        if (inputStates.space && typeof scene.shoot === "function") {
            console.log("Shooting...");
            scene.shoot();
            inputStates.space = false;
        }

        if (playerAnimations && playerAnimations.length > 0) {
            const walkAnim = playerAnimations.find(anim =>
                anim.name.toLowerCase().includes("walk") || anim.name.toLowerCase().includes("run"));
            if (walkAnim) {
                moved ? walkAnim.start(true) : walkAnim.stop();
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

export { createGrassScene };
