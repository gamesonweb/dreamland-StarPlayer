async function havokPhysics(scene) {
    let physicsPlugin;

    try {
        const havok = await HavokPhysics({
            locateFile: () => "./public/assets/HavokPhysics.wasm"
        });
        physicsPlugin = new BABYLON.HavokPlugin(true, havok);
    } catch (e) {
        console.warn("Havok failed to load, falling back to AmmoJS.");
        const ammo = await Ammo();
        physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
    }

    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), physicsPlugin);
}

function createFreeCamera(scene, canvas) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 10, 0), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();
    return camera;
}

function createFollowCamera(scene, target) {
    // Caméra suiveuse
    let followCamera = new BABYLON.FollowCamera("followCamera", new BABYLON.Vector3(0, 10, -10), scene);
    followCamera.lockedTarget = target;
    followCamera.radius = 8;
    followCamera.heightOffset = 35;
    followCamera.rotationOffset = 180;
    followCamera.inputs.clear();

    return followCamera;
}

let selectedCharacter = null;
let selectedMap = null;

function setSelectedCharacter(character) {
    selectedCharacter = character;
}

function setSelectedMap(map) {
    selectedMap = map;
}

function getSelectedCharacter() {
    return selectedCharacter;
}
function getSelectedMap() {
    return selectedMap;
}

// État clavier global
let inputStates = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    keyF: false,
};

function setupInput(scene) {
    scene.onKeyboardObservable.add((kbInfo) => {
        const pressed = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN; // 1 = KEYDOWN
        switch (kbInfo.event.key) {
            case "z":
            case "w":
            case "ArrowUp":
                inputStates.up = pressed;
                break;
            case "s":
            case "ArrowDown":
                inputStates.down = pressed;
                break;
            case "q":
            case "a":
            case "ArrowLeft":
                inputStates.left = pressed;
                break;
            case "d":
            case "ArrowRight":
                inputStates.right = pressed;
                break;
            case " ":
                inputStates.space = pressed;
                break;
            case "f":
                inputStates.keyF = pressed;
                break;
        }

        if (gameOver || !playerAlive) {
            // Désactive les contrôles si le jeu est terminé ou si le joueur est mort
            inputStates = {
                up: false,
                down: false,
                left: false,
                right: false,
                space: false,
                keyF: false,
            };
        }

    });
}

function normalizeMeshHeight(mesh, targetHeight = 2) {
    const boundingInfo = mesh.getHierarchyBoundingVectors();
    const size = boundingInfo.max.subtract(boundingInfo.min);
    const height = size.y;
    const scaleFactor = targetHeight / height;
    mesh.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
}

function createHPBar(scene, character, gui) {

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

    hpBarContainer.linkWithMesh(character.mesh);
    hpBarContainer.linkOffsetY = -50;

    // Texte flottant des HP au-dessus du dude
    const hpFloatingText = new BABYLON.GUI.TextBlock();
    hpFloatingText.color = "white";
    hpFloatingText.fontSize = 16;
    gui.addControl(hpFloatingText);
    hpFloatingText.linkWithMesh(character.mesh);
    hpFloatingText.linkOffsetY = -80;

    return {
        hpBarContainer,
        hpBarFill,
        hpFloatingText,
    };
}

function createAmmoBar(scene, character, gui) {

    // Conteneur de la barre de munitions
    const ammoBarContainer = new BABYLON.GUI.Rectangle();
    ammoBarContainer.width = "50px";
    ammoBarContainer.height = "8px";
    ammoBarContainer.cornerRadius = 4;
    ammoBarContainer.color = "white";
    ammoBarContainer.thickness = 1;
    ammoBarContainer.background = "grey";
    gui.addControl(ammoBarContainer);

    // Barre de remplissage
    const ammoBarFill = new BABYLON.GUI.Rectangle();
    ammoBarFill.width = 5;
    ammoBarFill.height = "100%";
    ammoBarFill.background = "orange";
    ammoBarFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    ammoBarContainer.addControl(ammoBarFill);

    // Position sous la barre de vie
    ammoBarContainer.linkWithMesh(character.mesh);
    ammoBarContainer.linkOffsetY = -40; // Ajuste selon besoin

    return {
        ammoBarContainer,
        ammoBarFill,
        update: (current, max) => {
            ammoBarFill.width = Math.max(current / max, 0);
        }
    };
}




function showEndGameScreen(scene, winnerTeamName, onHome) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI-End");

    // Fond semi-transparent
    const background = new BABYLON.GUI.Rectangle();
    background.width = "100%";
    background.height = "100%";
    background.background = "#000000AA";
    background.thickness = 0;
    ui.addControl(background);

    // Texte gagnant
    const winnerText = new BABYLON.GUI.TextBlock();
    winnerText.text = winnerTeamName === "égalité" ? "Égalité !" : `L'équipe ${winnerTeamName} a gagné !`;
    winnerText.color = "white";
    winnerText.fontSize = "36px";
    winnerText.top = "-10%";
    background.addControl(winnerText);

    // Bouton Accueil
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("home", "Accueil");
    homeButton.width = "150px";
    homeButton.height = "50px";
    homeButton.color = "white";
    homeButton.cornerRadius = 10;
    homeButton.background = "#2196F3";
    homeButton.top = "20%";
    homeButton.onPointerClickObservable.add(() => {
        ui.dispose();
        onHome();
    });
    background.addControl(homeButton);
}

function createGameTimerUI(scene, zoneControl) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const timerText = new BABYLON.GUI.TextBlock();
    timerText.text = "02:00";
    timerText.color = "white";
    timerText.fontSize = "36px";
    timerText.top = "-45%";
    timerText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    timerText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    ui.addControl(timerText);

    let totalSeconds = 120;
    let ended = false;

    const endGame = (winner) => {
        if (ended) return;
        ended = true;
        clearInterval(intervalId);
        scene.animationGroups?.forEach(group => group.stop());
        scene.onBeforeRenderObservable.clear();
        scene.disablePhysicsEngine();
        timerText.text = "00:00";

        showEndGameScreen(scene, winner, () => {
            window.location.reload();
        });
    };

    const intervalId = setInterval(() => {
        const scores = zoneControl.getScores();
        if (scores.red >= 100 || scores.blue >= 100) {
            const winner = scores.red > scores.blue ? "rouge" : scores.blue > scores.red ? "bleue" : "égalité";
            endGame(winner);
            return;
        }

        if (totalSeconds <= 0) {
            const winner = scores.red > scores.blue ? "rouge" : scores.blue > scores.red ? "bleue" : "égalité";
            endGame(winner);
            return;
        }

        totalSeconds--;

        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        timerText.text = `${minutes}:${seconds}`;
    }, 1000);

    return {
        stop: () => clearInterval(intervalId),
        setText: (txt) => timerText.text = txt
    };
}

