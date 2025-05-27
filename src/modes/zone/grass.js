// État clavier global
const inputStates = {
    up: false,
    down: false,
    left: false,
    right: false,
    keyF: false,
};

function setupInput(scene) {
    scene.onKeyboardObservable.add((kbInfo) => {
        const pressed = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN; // 1 = KEYDOWN
        switch (kbInfo.event.key) {
            case "z":
            case "ArrowUp":
                inputStates.up = pressed;
                break;
            case "s":
            case "ArrowDown":
                inputStates.down = pressed;
                break;
            case "q":
            case "ArrowLeft":
                inputStates.left = pressed;
                break;
            case "d":
            case "ArrowRight":
                inputStates.right = pressed;
                break;
            case "f":
                inputStates.keyF = pressed;
                break;
        }
    });
}

async function createGrassScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    // Caméra
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 10, 0), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();

    const havok = await HavokPhysics({
        locateFile: (file) => "assets/HavokPhysics.wasm"
    });
    const hk = new BABYLON.HavokPlugin(true, havok);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    setupInput(scene);

    let playerMesh = null;
    let playerAnimations = null;
    let followCamera = null;
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
    const timerUI = createGameTimerUI(scene, zoneController);

    // Création d'AssetsManager
    const assetsManager = new BABYLON.AssetsManager(scene);

    // Tâche pour charger la map
    const mapTask = assetsManager.addMeshTask("map task", "", "models/map/", "Dueling-Beetles.glb");
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
            playerMesh.showBoundingBox = true;
            playerMesh.position = new BABYLON.Vector3(0, 0, 32);
            playerMesh.scaling = new BABYLON.Vector3(2, 2, 2);

            playerAnimations = task.loadedAnimationGroups;

            // Caméra suiveuse
            followCamera = new BABYLON.FollowCamera("followCamera", new BABYLON.Vector3(0, 10, -10), scene);
            followCamera.lockedTarget = playerMesh;
            followCamera.radius = 10;
            followCamera.heightOffset = 40;
            followCamera.rotationOffset = 180;
            followCamera.inputs.clear();
            scene.activeCamera = followCamera;

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
            }

            // Clones rouges (3)
            for (let i = 0; i < 3; i++) {
                const clone = playerMesh.clone(`redClone${i}`);
                clone.position = playerMesh.position.add(new BABYLON.Vector3(-i - 1, 0, -40));
                teams.red.push(clone);
                addCloneAI(clone, teams.blue, scene, "red", projectiles);
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
