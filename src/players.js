import { Scene, ArcRotateCamera, Vector3, HemisphericLight, SceneLoader } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, StackPanel, Rectangle, TextBlock } from "@babylonjs/gui";
import "@babylonjs/loaders";
import { createHomeGameScene } from "./homeGame.js";
import {setSelectedCharacter} from "./gameState.js";

export function createPlayersScene(engine, canvas, setScene) {
    const scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.5, 8, new Vector3(2, 1, 0), scene);
    camera.setTarget(new Vector3(-1, 1, 0)); // vise le personnage
    camera.alpha = Math.PI / 2; // derrière
    camera.beta = Math.PI / 2.2;
    camera.radius = 5;
    camera.attachControl(canvas, false);
    camera.inputs.clear();


    // Light
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // GUI
    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Bouton retour
    const backButton = Button.CreateSimpleButton("backButton", "←");
    backButton.width = "50px";
    backButton.height = "50px";
    backButton.color = "black";
    backButton.background = "white";
    backButton.thickness = 0;
    backButton.fontSize = 30;
    backButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    backButton.paddingTop = "10px";
    backButton.paddingLeft = "10px";
    backButton.onPointerUpObservable.add(() => {
        setScene(createHomeGameScene(engine, canvas, setScene));
    });



    // Conteneur principal sur tout l'écran
    const rootPanel = new StackPanel();
    rootPanel.isVertical = false;
    rootPanel.width = "100%";
    rootPanel.height = "100%";
    gui.addControl(rootPanel);

    // Panel gauche : liste des persos
    const leftPanel = new StackPanel();
    leftPanel.width = "400px";
    leftPanel.height = "100%";
    leftPanel.paddingLeft = "10px";
    leftPanel.paddingTop = "10px";
    leftPanel.paddingRight = "10px";
    leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    leftPanel.background = "rgba(0, 0, 0, 0.4)";
    rootPanel.addControl(leftPanel);

    // Panel droit : affichage du perso choisi
    const rightPanel = new StackPanel();
    rightPanel.width = "100%";
    rightPanel.paddingTop = "20px";
    rightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    rootPanel.addControl(rightPanel);

    const selectedText = new TextBlock();
    selectedText.text = "Choisis un personnage";
    selectedText.color = "white";
    selectedText.fontSize = 28;
    selectedText.height = "60px";
    selectedText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    selectedText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    selectedText.paddingLeft= "400px";
    gui.addControl(selectedText);

    gui.addControl(backButton);

// Bouton flèche gauche
    const leftArrow = Button.CreateSimpleButton("left", "←");
    leftArrow.width = "60px";
    leftArrow.height = "60px";
    leftArrow.fontSize = 30;
    leftArrow.color = "white";
    leftArrow.background = "gray";
    leftArrow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    //leftArrow.paddingLeft = "200px";
    leftArrow.onPointerClickObservable.add(() => {
        if (activeMesh) activeMesh.rotation.y += 0.1;
    });

// Bouton flèche droite
    const rightArrow = Button.CreateSimpleButton("right", "→");
    rightArrow.width = "60px";
    rightArrow.height = "60px";
    rightArrow.fontSize = 30;
    rightArrow.color = "white";
    rightArrow.background = "gray";
    rightArrow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightArrow.onPointerClickObservable.add(() => {
        if (activeMesh) activeMesh.rotation.y -= 0.1;
    });

    // Nouveau conteneur pour les flèches en bas de l'écran
    const arrowPanel = new StackPanel();
    arrowPanel.isVertical = false;
    arrowPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    arrowPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    arrowPanel.height = "100px";
    arrowPanel.paddingBottom = "20px";
    arrowPanel.paddingLeft = "400px";
    arrowPanel.spacing = 700; // espace entre les flèches

// Ajout des flèches au nouveau panel
    arrowPanel.addControl(leftArrow);
    arrowPanel.addControl(rightArrow);
    gui.addControl(arrowPanel);



    let activeMesh = null;
    // Faire tourner le personnage choisi avec les flèches du clavier
    window.addEventListener("keydown", (event) => {
        if (!activeMesh) return;
        if (event.key === "ArrowLeft") activeMesh.rotation.y += 0.1;
        if (event.key === "ArrowRight") activeMesh.rotation.y -= 0.1;
    });

    const characters = [
        {
            name: "La mariée en bleuuuu",
            modelPath: "/models/personnages/",
            modelFile: "perso1.glb",
            thumbnail: "/thumbnails/grass.jpg",
            weaponType: "gun"
        },
        {
            name: "Archer",
            modelPath: "/models/",
            modelFile: "archer.glb",
            thumbnail: "/thumbnails/archer.png",
            weaponType: "bow"
        },
        {
            name: "Mage",
            modelPath: "/models/",
            modelFile: "mage.glb",
            thumbnail: "/thumbnails/mage.png",
            weaponType: "staff"
        }
    ];
    characters.forEach(char => {
        const button = Button.CreateImageOnlyButton(char.name, char.thumbnail);
        button.width = "120px";
        button.height = "120px";
        button.thickness = 2;
        button.color = "white";
        button.background = "black";
        button.paddingBottom = "15px";

        button.onPointerClickObservable.add(() => {
            selectedText.text = "Tu as choisi : " + char.name;

            if (activeMesh) {
                activeMesh.dispose();
                activeMesh = null;
            }

            SceneLoader.ImportMesh("", char.modelPath, char.modelFile, scene, (meshes, _, skeletons, animationGroups) => {
                activeMesh = meshes[0];
                activeMesh.name = "ActiveCharacter";
                activeMesh.position = new Vector3(-2.4, -0.5, 0);
                activeMesh.scaling = new Vector3(1.5, 1.5, 1.5);
                activeMesh.rotation = new Vector3(0, 0, 0);

            });
            setSelectedCharacter(char);
        });

        leftPanel.addControl(button);
    });


    return scene;
}
