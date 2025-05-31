function createSettingsScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    addBackgroundVideo(scene);
    // GUI
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // --- Bouton retour ---
    const backButton = BABYLON.GUI.Button.CreateSimpleButton("backButton", "←");
    backButton.width = "50px";
    backButton.height = "50px";
    backButton.color = "black";
    backButton.background = "white";
    backButton.thickness = 0;
    backButton.fontSize = 30;
    backButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    backButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    backButton.paddingTop = "10px";
    backButton.paddingLeft = "10px";
    backButton.onPointerUpObservable.add(() => {
        setScene(createHomeGameScene(engine, canvas, setScene));
    });


    // --- Titre ---
    const titleTextBlock = new BABYLON.GUI.TextBlock();
    titleTextBlock.text = "Paramètres";
    titleTextBlock.color = "white";
    titleTextBlock.fontSize = 32;
    titleTextBlock.height = "60px";
    titleTextBlock.top = "20px";
    titleTextBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    titleTextBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    gui.addControl(titleTextBlock);
    gui.addControl(backButton);
    // --- Encadré principal ---
    const mainFrame = new BABYLON.GUI.Rectangle();
    mainFrame.width = "400px";
    mainFrame.height = "400px";
    mainFrame.color = "white";
    mainFrame.thickness = 2;
    mainFrame.background = "#22222288";
    mainFrame.cornerRadius = 10;
    mainFrame.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainFrame.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    gui.addControl(mainFrame);

    // --- Panneau vertical dans l'encadré ---
    const mainPanel = new BABYLON.GUI.StackPanel();
    mainPanel.width = "100%";
    mainPanel.isVertical = true;
    mainPanel.paddingTop = "20px";
    mainPanel.paddingBottom = "20px";
    mainPanel.paddingLeft = "20px";
    mainPanel.paddingRight = "20px";
    mainPanel.spacing = 25;
    mainFrame.addControl(mainPanel);

    // --- Volume (Musique et Effets) ---
    const volumeTitle = new BABYLON.GUI.TextBlock();
    volumeTitle.text = "Volume";
    volumeTitle.color = "white";
    volumeTitle.fontSize = 24;
    volumeTitle.height = "40px";
    volumeTitle.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    mainPanel.addControl(volumeTitle);

    // Volume musique
    const musicPanel = new BABYLON.GUI.StackPanel();
    musicPanel.isVertical = false;
    musicPanel.height = "40px";
    musicPanel.spacing = 10;
    mainPanel.addControl(musicPanel);

    const musicLabel = new BABYLON.GUI.TextBlock();
    musicLabel.text = "Musique";
    musicLabel.color = "white";
    musicLabel.width = "100px";
    musicLabel.fontSize = 18;
    musicLabel.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    musicPanel.addControl(musicLabel);

    const musicSlider = new BABYLON.GUI.Slider();
    musicSlider.minimum = 0;
    musicSlider.maximum = 100;
    musicSlider.value = 50;
    musicSlider.height = "20px";
    musicSlider.width = "200px";
    musicSlider.onValueChangedObservable.add(() => {
        console.log(`Volume Musique: ${musicSlider.value}`);
    });
    musicPanel.addControl(musicSlider);

    // Volume effets sonores
    const effectsPanel = new BABYLON.GUI.StackPanel();
    effectsPanel.isVertical = false;
    effectsPanel.height = "40px";
    effectsPanel.spacing = 10;
    mainPanel.addControl(effectsPanel);

    const effectsLabel = new BABYLON.GUI.TextBlock();
    effectsLabel.text = "Effets";
    effectsLabel.color = "white";
    effectsLabel.width = "100px";
    effectsLabel.fontSize = 18;
    effectsLabel.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    effectsPanel.addControl(effectsLabel);

    const effectsSlider = new BABYLON.GUI.Slider();
    effectsSlider.minimum = 0;
    effectsSlider.maximum = 100;
    effectsSlider.value = 50;
    effectsSlider.height = "20px";
    effectsSlider.width = "200px";
    effectsSlider.onValueChangedObservable.add(() => {
        console.log(`Volume Effets: ${effectsSlider.value}`);
    });
    effectsPanel.addControl(effectsSlider);

    // --- Langue ---
    const langTitle = new BABYLON.GUI.TextBlock();
    langTitle.text = "Langue";
    langTitle.color = "white";
    langTitle.fontSize = 24;
    langTitle.height = "40px";
    langTitle.paddingTop = "10px";
    langTitle.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    mainPanel.addControl(langTitle);

    const languages = ["Français", "English", "Español"];
    let currentLanguage = languages[0];

    const languageButton = BABYLON.GUI.Button.CreateSimpleButton("languageButton", currentLanguage);
    languageButton.width = "300px";
    languageButton.height = "40px";
    languageButton.color = "black";
    languageButton.background = "white";
    mainPanel.addControl(languageButton);

    const languageListPanel = new BABYLON.GUI.StackPanel();
    languageListPanel.width = "300px";
    languageListPanel.isVertical = true;
    languageListPanel.isVisible = false;
    mainPanel.addControl(languageListPanel);

    languages.forEach(lang => {
        const langOption = BABYLON.GUI.Button.CreateSimpleButton(`lang-${lang}`, lang);
        langOption.height = "30px";
        langOption.color = "black";
        langOption.background = "#dddddd";
        langOption.onPointerUpObservable.add(() => {
            currentLanguage = lang;
            languageButton.textBlock.text = lang;
            languageListPanel.isVisible = false;
            console.log("Langue sélectionnée :", lang);
        });
        languageListPanel.addControl(langOption);
    });

    languageButton.onPointerUpObservable.add(() => {
        languageListPanel.isVisible = !languageListPanel.isVisible;
    });

    // --- Bouton Sauvegarder ---
    const saveButton = BABYLON.GUI.Button.CreateSimpleButton("saveButton", "Sauvegarder");
    saveButton.width = "150px";
    saveButton.height = "40px";
    saveButton.color = "white";
    saveButton.background = "#007ACC";
    saveButton.cornerRadius = 5;
    saveButton.fontSize = 18;
    saveButton.top = "20px";
    saveButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    saveButton.onPointerUpObservable.add(() => {
        console.log("Paramètres sauvegardés :");
        console.log(`Musique: ${musicSlider.value}`);
        console.log(`Effets: ${effectsSlider.value}`);
        console.log(`Langue: ${currentLanguage}`);
        // Ici tu peux sauvegarder les paramètres réellement (localStorage, API, etc.)
    });
    mainPanel.addControl(saveButton);

    return scene;
}
