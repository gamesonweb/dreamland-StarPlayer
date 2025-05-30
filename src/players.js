function createPlayersScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.5, 8, new BABYLON.Vector3(2, 1, 0), scene);
    camera.setTarget(new BABYLON.Vector3(-1, 1, 0)); // vise le personnage
    camera.alpha = Math.PI / 2; // derrière
    camera.beta = Math.PI / 2.2;
    camera.radius = 5;
    camera.attachControl(canvas, false);
    camera.inputs.clear();

    // Light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    addBackgroundVideo(scene);
    // GUI
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Bouton retour
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



    // Conteneur principal sur tout l'écran
    const rootPanel = new BABYLON.GUI.StackPanel();
    rootPanel.isVertical = false;
    rootPanel.width = "100%";
    rootPanel.height = "100%";
    gui.addControl(rootPanel);

    // Panel gauche : liste des persos
    const leftPanel = new BABYLON.GUI.StackPanel();
    leftPanel.width = "400px";
    leftPanel.height = "100%";
    leftPanel.paddingLeft = "10px";
    leftPanel.paddingTop = "10px";
    leftPanel.paddingRight = "10px";
    leftPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    leftPanel.background = "rgba(0, 0, 0, 0.4)";
    rootPanel.addControl(leftPanel);

    // Panel droit : affichage du perso choisi
    const rightPanel = new BABYLON.GUI.StackPanel();
    rightPanel.width = "100%";
    rightPanel.paddingTop = "20px";
    rightPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    rootPanel.addControl(rightPanel);

    const selectedText = new BABYLON.GUI.TextBlock();
    selectedText.text = "Choisis un personnage";
    selectedText.color = "white";
    selectedText.fontSize = 28;
    selectedText.height = "60px";
    selectedText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    selectedText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    selectedText.paddingLeft= "400px";
    gui.addControl(selectedText);

    gui.addControl(backButton);

// Bouton flèche gauche
    const leftArrow = BABYLON.GUI.Button.CreateSimpleButton("left", "←");
    leftArrow.width = "60px";
    leftArrow.height = "60px";
    leftArrow.fontSize = 30;
    leftArrow.color = "white";
    leftArrow.background = "gray";
    leftArrow.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftArrow.onPointerClickObservable.add(() => {
        if (activeMesh) activeMesh.rotation.y += 0.1;
    });

// Bouton flèche droite
    const rightArrow = BABYLON.GUI.Button.CreateSimpleButton("right", "→");
    rightArrow.width = "60px";
    rightArrow.height = "60px";
    rightArrow.fontSize = 30;
    rightArrow.color = "white";
    rightArrow.background = "gray";
    rightArrow.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightArrow.onPointerClickObservable.add(() => {
        if (activeMesh) activeMesh.rotation.y -= 0.1;
    });

    // Nouveau conteneur pour les flèches en bas de l'écran
    const arrowPanel = new BABYLON.GUI.StackPanel();
    arrowPanel.isVertical = false;
    arrowPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    arrowPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    arrowPanel.height = "100px";
    arrowPanel.paddingBottom = "20px";
    arrowPanel.paddingLeft = "400px";
    arrowPanel.spacing = 700;

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

    // Préchargement
    const characters = getCharacters();
    const assetManager = new BABYLON.AssetsManager(scene);
    const characterMeshes = {};

    characters.forEach(char => {
        const task = assetManager.addMeshTask(char.name + "Task", "", char.modelPath, char.modelFile);
        task.onSuccess = (task) => {
            const mesh = task.loadedMeshes[0];
            mesh.setEnabled(false);
            mesh.position = new BABYLON.Vector3(-2.4, -0.5, 0);
            mesh.rotation = new BABYLON.Vector3(0, 0, 0);

            const boundingInfo = mesh.getHierarchyBoundingVectors();
            const size = boundingInfo.max.subtract(boundingInfo.min);
            const height = size.y;

            // Normaliser l'échelle pour que tous les personnages aient la même hauteur
            const targetHeight = 2;
            const scaleFactor = targetHeight / height;
            mesh.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);

            characterMeshes[char.name] = mesh;

        };
    });

    assetManager.onFinish = () => {
        characters.forEach(char => {
            const button = BABYLON.GUI.Button.CreateImageOnlyButton(char.name, char.thumbnail);
            button.width = "120px";
            button.height = "120px";
            button.thickness = 2;
            button.color = "white";
            button.background = "black";
            button.paddingBottom = "15px";

            button.onPointerClickObservable.add(() => {
                selectedText.text = "Tu as choisi : " + char.name;
                if (activeMesh) activeMesh.setEnabled(false);
                activeMesh = characterMeshes[char.name];
                if (activeMesh) activeMesh.setEnabled(true);
                setSelectedCharacter(char);
            });

            leftPanel.addControl(button);
        });
    };

    assetManager.load();

    return scene;
}

function getCharacters(){
    return [
        {
            name: "Wendy",
            modelPath: "./public/models/personnages/",
            modelFile: "wendy.glb",
            thumbnail: "./public/thumbnails/Wendy.png",
            weaponType: "gun",
            maxHP: 7000
        },
        {
            name: "Colt",
            modelPath: "./public/models/personnages/",
            modelFile: "colt_player_geo.glb",
            thumbnail: "./public/thumbnails/Colt.png",
            weaponType: "guns",
            maxHP: 5000
        },
        {
            name: "Piper",
            modelPath: "./public/models/personnages/",
            modelFile: "mariposa_piper.glb",
            thumbnail: "./public/thumbnails/Piper.png",
            weaponType: "umbrella",
            maxHP: 3500
        },
        {
            name: "Nita",
            modelPath: "./public/models/personnages/",
            modelFile: "runner_nita.glb",
            thumbnail: "./public/thumbnails/Nita.png",
            weaponType: "shield",
            maxHP: 4000
        }
    ];
}
