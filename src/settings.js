import { Scene, ArcRotateCamera, Vector3, HemisphericLight } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Slider, StackPanel, TextBlock, Button } from "@babylonjs/gui";
import {createHomeGameScene} from "./homeGame.js";

export function createSettingsScene(engine, canvas, setScene, createHomeScene) {
    // Create a new scene
    let scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Light
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // GUI
    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // --- Bouton flèche en haut à gauche ---
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
        // Appelle la fonction pour retourner à la page d'accueil
        setScene(createHomeGameScene(engine, canvas, setScene));
    });


    // --- Titre ---
    const titleTextBlock = new TextBlock();
    titleTextBlock.text = "Paramètres";
    titleTextBlock.color = "white";
    titleTextBlock.fontSize = 28;
    titleTextBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    titleTextBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    titleTextBlock.paddingBottom = "65%";
    gui.addControl(titleTextBlock);
    gui.addControl(backButton);

    // Panel des paramètres centré verticalement
    const settingsPanel = new StackPanel("settingsPanel");
    settingsPanel.width = "400px";
    settingsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    settingsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    gui.addControl(settingsPanel);

    // Volume slider
    const volumeSlider = new Slider();
    volumeSlider.minimum = 0;
    volumeSlider.maximum = 100;
    volumeSlider.value = 50; // Default value
    volumeSlider.height = "20px";
    volumeSlider.width = "200px";
    volumeSlider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    volumeSlider.onValueChangedObservable.add(() => {
        console.log(`Volume: ${volumeSlider.value}`);
        // Update game volume here
    });
    settingsPanel.addControl(volumeSlider);

    return scene;
}
