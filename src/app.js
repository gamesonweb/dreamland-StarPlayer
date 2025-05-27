import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine } from "@babylonjs/core";
import {createLoadingScreen} from "./loadingScreen.js";
import {createHomeGameScene} from "./homeGame.js";
class App {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);
        this.engine = new Engine(this.canvas, true);
        this.scene = null;

        createLoadingScreen(this.engine, this.canvas, () => {
            this.setScene(createHomeGameScene(this.engine, this.canvas, this.setScene.bind(this)));

            this.engine.runRenderLoop(() => {
                if (this.scene && typeof this.scene.render=== "function")
                    this.scene.render();
            });
        });
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    setScene(newScene) {
        if (this.scene) {
            this.scene.dispose();
        }
        this.scene = newScene;
    }

}
new App();
