function createLoadingScreen(engine, canvas, onLoadingComplete) {
    let scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Caméra
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    // Lumière
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // GUI pour le texte seulement (pas la barre)
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    const textBlock = new BABYLON.GUI.TextBlock();
    textBlock.text = "Chargement... 0%";
    textBlock.color = "white";
    textBlock.fontSize = 18;
    textBlock.top = "-50px";
    gui.addControl(textBlock);

    // Création du plan pour afficher la vidéo (barre de chargement animée)
    const videoPlane = BABYLON.MeshBuilder.CreatePlane("videoPlane", { width: 5, height: 0.4 }, scene);
    videoPlane.position = new BABYLON.Vector3(0, 0, 0); // devant la caméra

    // Création de la VideoTexture
    const videoTexture = new BABYLON.VideoTexture(
        "starsVideo",
        ["./assets/background/Stars.mp4"],
        scene,
        true,
        true,
        BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE,
        { autoPlay: true, loop: true, muted: true }
    );

    // Matériel pour le plan vidéo
    const videoMat = new BABYLON.StandardMaterial("videoMat", scene);
    videoMat.diffuseTexture = videoTexture;
    videoMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    videoMat.backFaceCulling = false;
    videoPlane.material = videoMat;
    videoPlane.scaling.x = 0;

    // Préparation du chargement des personnages
    const assetsManager = new BABYLON.AssetsManager(scene);
    const loadedCharacters = {};
    const characters = getCharacters();

    characters.forEach(char => {
        const task = assetsManager.addMeshTask(char.name + "Task", "", char.modelPath, char.modelFile);
        task.onSuccess = (task) => {
            const mesh = task.loadedMeshes[0];
            mesh.setEnabled(false);
            loadedCharacters[char.name] = mesh;
        };
    });

    assetsManager.onProgress = (remainingCount, totalCount) => {
        const progress = (1 - remainingCount / totalCount);
        videoPlane.scaling.x = progress * 5;
        textBlock.text = `Chargement... ${Math.round(progress * 100)}%`;
    };

    assetsManager.onFinish = () => {
        gui.dispose();
        videoPlane.dispose();
        onLoadingComplete(scene, loadedCharacters);
    };

    assetsManager.onTaskError = (task) => {
        alert("Erreur de chargement : " + task.name);
    };

    assetsManager.load();

    return scene;
}
