async function createGrassScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    createFreeCamera(scene, canvas);
    await havokPhysics(scene);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    setupInput(scene);

    let playerMesh = null;
    let playerAnimations = null;
    let weapon = null;

    const character = getSelectedCharacter();
    const projectiles = [];

    // Initialisation des équipes
    const teams = {
        red: [],
        blue: []
    };

    // Crée la zone de capture
    const zoneController = setupZoneControl(scene, teams);
    createGameTimerUI(scene, zoneController);

    // Création d'AssetsManager
    const assetsManager = new BABYLON.AssetsManager(scene);

    // Tâche pour charger la map
    const mapTask = assetsManager.addMeshTask("map task", "", "./public/models/map/", "Dueling-Beetles.glb");
    mapTask.onSuccess = (task) => {
        task.loadedMeshes.forEach(mesh => {
            if (mesh.getTotalVertices() > 0) {
                console.log("Map Mesh:", mesh.name);
                if (mesh.name === "Sol" || mesh.name.startsWith("Brique_") || mesh.name.startsWith("Beton_")) {
                    mesh.checkCollisions = true;
                    new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.3 }, scene);
                }
            }
        });
    };

    // Tâche pour charger le personnage
    let characterTask;
    if (character) {
        characterTask = assetsManager.addMeshTask("character task", "", character.modelPath, character.modelFile);
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

            playerMesh.hpGui = createHPBar(scene, playerMesh);
            playerMesh.updateHpBar = updateHpBar.bind(playerMesh);

            switch (character.weaponType) {
                case "gun":
                    weapon = new FireGun(task.loadedMeshes.find(m => m.name.includes("Gun")), playerMesh, scene);
                    break;
                case "sword":
                    weapon = new Sword(playerMesh, scene);
                    break;
                default:
                    console.warn("Type d'arme inconnu :", character.weaponType);
            }

            teams.blue.push(playerMesh);

            // Clones bleus (2)
            for (let i = 0; i < 2; i++) {
                const clone = playerMesh.clone(`blueClone${i}`);
                clone.position = playerMesh.position.add(new BABYLON.Vector3(i + 1, 0, 0));
                teams.blue.push(clone);
                addCloneAI(clone, teams.red, scene, "blue", projectiles);

                clone.hpGui = createHPBar(scene, clone);
                clone.updateHpBar = updateHpBar.bind(clone);
            }

            // Clones rouges (3)
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

    // Chargement de tous les assets
    assetsManager.load();

    const progressBars = createProgressBars(scene);

    // Mise à jour chaque frame
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

        if (weapon) {
            weapon.fire(inputStates);
        }

        if (playerAnimations && playerAnimations.length > 0) {
            const walkAnim = playerAnimations.find(anim =>
                anim.name.toLowerCase().includes("walk") || anim.name.toLowerCase().includes("run"));
            if (walkAnim) {
                if (moved) {
                    walkAnim.start(true);
                } else {
                    walkAnim.stop();
                }
            }
        }

        zoneController.update();
        const scores = zoneController.getScores();
        progressBars.update(scores.red, scores.blue, 100);
    });

    return scene;
}
function updateHpBar()  {
    const ratio = Math.max(this.hp / this.hpMax, 0);
    this.hpGui.hpBarFill.width = ratio;
    this.hpGui.hpFloatingText.text = this.hp.toString();
    this.hpGui.hpBarFill.background = ratio <= 0.3 ? "red" : "green";
}