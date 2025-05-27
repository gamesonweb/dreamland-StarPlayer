function createLoadingScreen(engine, canvas, onLoadingComplete) {
    let scene = new BABYLON.Scene(engine);

    // Désactiver le loading screen par défaut
    engine.loadingScreen.displayLoadingUI = function () {};
    engine.loadingScreen.hideLoadingUI = function () {};

    // GUI personnalisé
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const loadingBarContainer = new BABYLON.GUI.Rectangle();
    loadingBarContainer.width = "50%";
    loadingBarContainer.height = "40px";
    loadingBarContainer.cornerRadius = 10;
    loadingBarContainer.color = "white";
    loadingBarContainer.thickness = 2;
    loadingBarContainer.background = "green";
    gui.addControl(loadingBarContainer);

    const loadingBar = new BABYLON.GUI.Rectangle();
    loadingBar.width = "0%";
    loadingBar.height = "100%";
    loadingBar.cornerRadius = 10;
    loadingBar.color = "white";
    loadingBar.background = "green";
    loadingBarContainer.addControl(loadingBar);

    const textBlock = new BABYLON.GUI.TextBlock();
    textBlock.text = "Chargement... 0%";
    textBlock.color = "blue";
    textBlock.fontSize = 18;
    textBlock.top = "-50px";
    gui.addControl(textBlock);

    // Manager d'assets
    const assetsManager = new BABYLON.AssetsManager(scene);
    const personModelTask = assetsManager.addMeshTask("person", "", "models/personnages/", "perso1.glb");

    assetsManager.onProgress = (remainingCount, totalCount) => {
        const progress = (1 - remainingCount / totalCount) * 100;
        loadingBar.width = `${progress}%`;
        textBlock.text = `Chargement... ${Math.round(progress)}%`;
    };

    assetsManager.onFinish = (tasks) => {
        gui.dispose(); // supprime tout le GUI de chargement
        onLoadingComplete(scene);
    };

    assetsManager.onTaskError = function(task) {
        alert("Erreur de chargement : " + task.name);
    };

    assetsManager.load();

    /*// Affichage du chargement
    engine.runRenderLoop(() => {
        if (scene.activeCamera) scene.render();
    });*/
}
