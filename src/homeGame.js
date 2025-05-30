function createHomeGameScene(engine, canvas, setScene) {
    let scene = new BABYLON.Scene(engine);

    // Caméra
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();
    // Lumière
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
// Texture vidéo
    /*<a href="https://fr.freepik.com/video-gratuite/animation-arriere-plan-merveilleux-chute-etoiles_3306016#fromView=search&page=1&position=4&uuid=9e1ae306-cbd4-4c63-b20b-78bc44c989f2">Vidéo de freepik</a>*/
    const videoTexture = new BABYLON.VideoTexture(
        "backgroundVideo",
        ["assets/background/Stars.mp4"],
        scene,
        true,
        true,
        BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE,
        { autoUpdateTexture: true }
    );

    const backgroundLayer = new BABYLON.Layer("backgroundLayer", null, scene);
    backgroundLayer.texture = videoTexture;
    backgroundLayer.isBackground = true; // Assure que ça reste derrière tout


    // GUI
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Menu de gauche - Choix du personnage
    const leftPanel = new BABYLON.GUI.StackPanel("leftPanel");
    leftPanel.width = "200px";
    leftPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    leftPanel.paddingLeft = "10px";
    gui.addControl(leftPanel);

    const btnChooseCharacter = new BABYLON.GUI.Button("btnChooseCharacter");
    btnChooseCharacter.width = "150px";
    btnChooseCharacter.height = "40px";
    btnChooseCharacter.color = "white";
    btnChooseCharacter.background = "blue";
    btnChooseCharacter.cornerRadius = 10;
    btnChooseCharacter.thickness = 0;
    const txtCharacter = new BABYLON.GUI.TextBlock();
    txtCharacter.text = "Personnages";
    txtCharacter.color = "white";
    btnChooseCharacter.addControl(txtCharacter);
    btnChooseCharacter.onPointerUpObservable.add(() => {
        const characterScene = createPlayersScene(engine, canvas, setScene);
        setScene(characterScene);
    });
    leftPanel.addControl(btnChooseCharacter);

    // Préchargement du personnage sélectionné avec AssetManager
    const character = getSelectedCharacter();

    if (character) {
        const assetManager = new BABYLON.AssetsManager(scene);

        const task = assetManager.addMeshTask(
            "loadSelectedCharacter",
            "",
            character.modelPath,
            character.modelFile
        );

        task.onSuccess = (task) => {
            const mesh = task.loadedMeshes[0];
            mesh.name = "ActiveCharacter";
            mesh.position = new BABYLON.Vector3(-2.4, -0.5, 0);
            mesh.rotation = new BABYLON.Vector3(0, 0, 0);

            // Appliquer la mise à l’échelle normalisée (même logique que createPlayersScene)
            normalizeMeshHeight(mesh, 2);

            // Activer le mesh
            mesh.setEnabled(true);
        };

        task.onError = (task, message, exception) => {
            console.error("Erreur chargement personnage : ", message, exception);
        };

        assetManager.load();
    }

    // Menu bas - Choix de la map et bouton jouer
    const bottomPanel = new BABYLON.GUI.StackPanel("bottomPanel");
    bottomPanel.height = "200px";
    bottomPanel.isVertical = false;
    bottomPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    bottomPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomPanel.spacing = 260;
    bottomPanel.paddingLeft = "400px";
    gui.addControl(bottomPanel);

    // Bouton Maps
    const btnChooseMap = new BABYLON.GUI.Button("btnChooseMap");
    btnChooseMap.width = "370px";
    btnChooseMap.height = "100px";
    btnChooseMap.color = "white";
    btnChooseMap.background = "green";
    btnChooseMap.cornerRadius = 10;
    btnChooseMap.thickness = 0;

    const txtMap = new BABYLON.GUI.TextBlock();
    const selectedMap = getSelectedMap();
    txtMap.text = selectedMap ? selectedMap.name : "Maps";
    txtMap.color = "white";
    txtMap.fontSize = 24;
    btnChooseMap.addControl(txtMap);
    btnChooseMap.onPointerUpObservable.add(() => {
        const mapScene = createMapsScene(engine, canvas, setScene);
        setScene(mapScene);
    });
    bottomPanel.addControl(btnChooseMap);

    // Bouton Jouer
    const btnPlay = new BABYLON.GUI.Button("btnPlay");
    btnPlay.width = "200px";
    btnPlay.height = "70px";
    btnPlay.color = "white";
    btnPlay.background = "red";
    btnPlay.cornerRadius = 10;
    btnPlay.thickness = 0;
    btnPlay.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    const txtPlay = new BABYLON.GUI.TextBlock();
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


