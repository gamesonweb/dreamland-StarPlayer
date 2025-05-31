class App {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);

        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;

        // Désactiver l'UI de chargement Babylon par défaut
        this.engine.loadingScreen.displayLoadingUI = function () {};
        this.engine.loadingScreen.hideLoadingUI = function () {};

        // Commencer le renderLoop IMMÉDIATEMENT
        this.engine.runRenderLoop(() => {
            if (this.scene && typeof this.scene.render === "function") {
                this.scene.render();
            }
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        // Lancer la scène de chargement
        this.setScene(createLoadingScreen(this.engine, this.canvas, () => {
            this.setScene(createHomeGameScene(this.engine, this.canvas, this.setScene.bind(this)));
        }));
    }

    setScene(newScene) {
        if (this.scene) {
            this.scene.dispose();
        }
        this.scene = newScene;
    }
}

new App();
