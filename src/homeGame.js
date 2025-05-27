import {Scene, ArcRotateCamera, Vector3, HemisphericLight, Color3, SceneLoader} from "@babylonjs/core";
import {AdvancedDynamicTexture, Button, Control, StackPanel, TextBlock} from "@babylonjs/gui";
import {createSettingsScene} from "./settings.js";
import {createPlayersScene} from "./players.js";
import {createMapsScene} from "./maps.js";
import {getSelectedCharacter,getSelectedMap} from "./gameState.js";

export function createHomeGameScene(engine, canvas,setScene) {
    let scene = new Scene(engine);
// Caméra
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();

    // Lumière
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    // Menu de gauche - Choix du personnage
    const leftPanel = new StackPanel("leftPanel");
    leftPanel.width = "200px";
    leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    leftPanel.paddingLeft = "10px";
    gui.addControl(leftPanel);

    const btnChooseCharacter = new Button("btnChooseCharacter");
    btnChooseCharacter.width = "150px";
    btnChooseCharacter.height = "40px";
    btnChooseCharacter.color = "white";
    btnChooseCharacter.background = "blue";
    btnChooseCharacter.cornerRadius = 10;
    btnChooseCharacter.thickness = 0;
    const txtCharacter = new TextBlock();
    txtCharacter.text = "Personnages";
    txtCharacter.color = "white";
    btnChooseCharacter.addControl(txtCharacter);
    btnChooseCharacter.onPointerUpObservable.add(() => {
        console.log("Choisir un personnage");
        scene.dispose();
        const characterScene = createPlayersScene(engine, canvas, setScene);
        setScene(characterScene);
    });
    leftPanel.addControl(btnChooseCharacter);

    // Récupérer le personnage sélectionné
    const character = getSelectedCharacter();
    if (character) {
        SceneLoader.ImportMesh("", character.modelPath, character.modelFile, scene, (meshes, _, skeletons, animationGroups) => {
            meshes = meshes[0];
            meshes.name = "ActiveCharacter";
            meshes.position = new Vector3(-2.4, -0.5, 0);
            meshes.scaling = new Vector3(1.5, 1.5, 1.5);
            meshes.rotation = new Vector3(0, 0, 0);
        });
    }

    // Menu bas - Choix de la map et bouton jouer
    const bottomPanel = new StackPanel("bottomPanel");
    bottomPanel.height = "200px";
    bottomPanel.isVertical = false; // <-- Important !
    bottomPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    bottomPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomPanel.spacing = 260; // espace entre les boutons
    bottomPanel.paddingLeft = "400px";
    gui.addControl(bottomPanel);

// Bouton Maps
    const btnChooseMap = new Button("btnChooseMap");
    btnChooseMap.width = "370px";
    btnChooseMap.height = "100px";
    btnChooseMap.color = "white";
    btnChooseMap.background = "green";
    btnChooseMap.cornerRadius = 10;
    btnChooseMap.thickness = 0;

    const txtMap = new TextBlock();
    const selectedMap = getSelectedMap();
    txtMap.text = selectedMap ? selectedMap.name : "Maps";
    txtMap.color = "white";
    txtMap.fontSize = 24;
    btnChooseMap.addControl(txtMap);
    btnChooseMap.onPointerUpObservable.add(() => {
        scene.dispose();
        const mapScene = createMapsScene(engine, canvas, setScene);
        setScene(mapScene);
    });
    bottomPanel.addControl(btnChooseMap);

// Bouton Jouer
    const btnPlay = new Button("btnPlay");
    btnPlay.width = "200px";
    btnPlay.height = "70px";
    btnPlay.color = "white";
    btnPlay.background = "red";
    btnPlay.cornerRadius = 10;
    btnPlay.thickness = 0;
    btnPlay.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    const txtPlay = new TextBlock();
    txtPlay.text = "Jouer";
    txtPlay.color = "white";
    txtPlay.fontSize = 24;
    btnPlay.addControl(txtPlay);
    btnPlay.onPointerUpObservable.add(async () => {
        if (!getSelectedCharacter() || !getSelectedMap()) {
            alert("Tu dois choisir un personnage et une map !");
            return;
        }
        console.log("Jouer avec le personnage : " + getSelectedCharacter().name + " sur la map : " + getSelectedMap().name);
        scene.dispose();
        const gameScene = await getSelectedMap().sceneBuilder(engine, canvas, getSelectedCharacter().modelPath, getSelectedCharacter().modelFile, setScene);
        setScene(gameScene);


    });
    bottomPanel.addControl(btnPlay);


    // Bouton paramètres - en haut à droite
    const btnSettings = new Button("btnSettings");
    btnSettings.width = "50px";
    btnSettings.height = "50px";
    btnSettings.cornerRadius = 25;
    btnSettings.color = "white";
    btnSettings.background = "gray";
    btnSettings.thickness = 0;
    btnSettings.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btnSettings.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    btnSettings.paddingRight = "10px";
    btnSettings.paddingTop = "10px";

    const txtGear = new TextBlock();
    txtGear.text = "⚙️";
    txtGear.color = "white";
    txtGear.fontSize = 24;
    btnSettings.addControl(txtGear);

    btnSettings.onPointerUpObservable.add(() => {
        console.log("Ouvrir les paramètres");
       scene.dispose();
        const settingsScene = createSettingsScene(engine, canvas, setScene);
        setScene(settingsScene);

    });

    gui.addControl(btnSettings);


    return scene;
}