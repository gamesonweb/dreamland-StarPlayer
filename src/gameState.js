async function havokPhysics(scene) {
    const havok = await HavokPhysics({
        locateFile: (file) => "./assets/HavokPhysics.wasm"
    });
    const hk = new BABYLON.HavokPlugin(true, havok);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
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
    followCamera.radius = 10;
    followCamera.heightOffset = 40;
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
    });
}
function normalizeMeshHeight(mesh, targetHeight = 2) {
    const boundingInfo = mesh.getHierarchyBoundingVectors();
    const size = boundingInfo.max.subtract(boundingInfo.min);
    const height = size.y;
    const scaleFactor = targetHeight / height;
    mesh.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
}

function createHPBar(scene, character) {
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
    hpBarContainer.linkWithMesh(character.mesh);
    hpBarContainer.linkOffsetY = -60;
    hpBarContainer.addControl(hpBarFill);

    // Texte flottant des HP au-dessus du dude
    const hpFloatingText = new BABYLON.GUI.TextBlock();
    hpFloatingText.color = "white";
    hpFloatingText.fontSize = 16;
    hpFloatingText.linkWithMesh(character.mesh);
    hpFloatingText.linkOffsetY = -80;
    gui.addControl(hpFloatingText);

    return {
        hpBarContainer,
        hpBarFill,
        hpFloatingText,
    };
}

function showEndGameScreen(scene, winnerTeamName, onReplay, onHome) {
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

    // Bouton Rejouer
    const replayButton = BABYLON.GUI.Button.CreateSimpleButton("replay", "Rejouer");
    replayButton.width = "150px";
    replayButton.height = "50px";
    replayButton.color = "white";
    replayButton.cornerRadius = 10;
    replayButton.background = "#4CAF50";
    replayButton.top = "10%";
    replayButton.onPointerClickObservable.add(() => {
        ui.dispose(); // supprime l'écran
        onReplay();   // action à définir
    });
    background.addControl(replayButton);

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
        onHome(); // action à définir
    });
    background.addControl(homeButton);
}