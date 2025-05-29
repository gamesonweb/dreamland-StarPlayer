function createMapsScene(engine, canvas, setScene) {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // GUI
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Bouton retour
    const backButton = BABYLON.GUI.Button.CreateSimpleButton("backButton", "←");
    backButton.width = "50px";
    backButton.height = "50px";
    backButton.color = "black";
    backButton.background = "white";
    backButton.fontSize = 30;
    backButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    backButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    backButton.paddingTop = "10px";
    backButton.paddingLeft = "10px";
    backButton.onPointerUpObservable.add(() => {
        setScene(createHomeGameScene(engine, canvas, setScene));
    });
    gui.addControl(backButton);

    const maps = getMaps();

    let currentIndex = 0;

    const mainPanel = new BABYLON.GUI.StackPanel();
    mainPanel.width = "100%";
    mainPanel.height = "60%";
    mainPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    mainPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainPanel.isVertical = true;
    mainPanel.spacing = 20;
    gui.addControl(mainPanel);

    const carouselPanel = new BABYLON.GUI.StackPanel();
    carouselPanel.isVertical = false;
    carouselPanel.height = "150px";
    carouselPanel.spacing = 20;
    mainPanel.addControl(carouselPanel);

    function updateCarousel() {
        carouselPanel.clearControls();
        for (let i = currentIndex; i < Math.min(currentIndex + 3, maps.length); i++) {
            const map = maps[i];

            const rect = new BABYLON.GUI.Rectangle();
            rect.width = "400px";
            rect.height = "150px";
            rect.thickness = 2;
            rect.color = "white";
            rect.background = "black";
            rect.cornerRadius = 10;

            const img = new BABYLON.GUI.Image("img_" + map.name, map.thumbnail);
            img.width = "400px";
            img.height = "150px";
            img.paddingTop = "5px";

            const label = new BABYLON.GUI.TextBlock();
            label.text = map.name;
            label.height = "40px";
            label.color = "white";
            label.fontSize = 18;
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

            rect.addControl(img);
            rect.addControl(label);

            rect.onPointerClickObservable.add(() => {
                console.log("Sélection : " + map.name);
                setSelectedMap(map);
                scene.dispose();
                setScene(createHomeGameScene(engine, canvas, setScene));
            });

            carouselPanel.addControl(rect);
        }
    }

    updateCarousel();

    const arrowPanel = new BABYLON.GUI.StackPanel();
    arrowPanel.isVertical = false;
    arrowPanel.spacing = 700;
    arrowPanel.height = "80px";
    arrowPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    arrowPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gui.addControl(arrowPanel);

    const leftArrow = BABYLON.GUI.Button.CreateSimpleButton("left", "←");
    leftArrow.width = "60px";
    leftArrow.height = "60px";
    leftArrow.color = "white";
    leftArrow.background = "gray";
    leftArrow.fontSize = 30;
    leftArrow.onPointerClickObservable.add(() => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    const rightArrow = BABYLON.GUI.Button.CreateSimpleButton("right", "→");
    rightArrow.width = "60px";
    rightArrow.height = "60px";
    rightArrow.color = "white";
    rightArrow.background = "gray";
    rightArrow.fontSize = 30;
    rightArrow.onPointerClickObservable.add(() => {
        if (currentIndex < maps.length - 3) {
            currentIndex++;
            updateCarousel();
        }
    });

    arrowPanel.addControl(leftArrow);
    arrowPanel.addControl(rightArrow);

    return scene;
}


function getMaps() {
    return [
            {
                name: "Plaine",
                thumbnail: "/thumbnails/grass.jpg",
                sceneBuilder: createGrassScene },
            {
                name: "Hors Jeu 1",
                thumbnail: "/thumbnails/horsJeu1.jpg" ,
                sceneBuilder: createHorsJeu1Scene },
            {
                name: "Neige",
                thumbnail: "/thumbnails/snow.jpg" },
            {
                name: "Lave",
                thumbnail: "/thumbnails/lava.jpg" },
            {
                name: "Ville",
                thumbnail: "/thumbnails/city.jpg" },

    ];
}