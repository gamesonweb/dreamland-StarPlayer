import { AdvancedDynamicTexture, TextBlock, Control } from "@babylonjs/gui";
import {showEndGameScreen} from "./endGame.js";
import {createHomeGameScene} from "./homeGame.js";
export function createGameTimerUI(scene, zoneControl) {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const timerText = new TextBlock();
    timerText.text = "02:00";
    timerText.color = "white";
    timerText.fontSize = "36px";
    timerText.top = "-45%";
    timerText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    timerText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    ui.addControl(timerText);

    let totalSeconds = 120;
    let ended = false;

    const endGame = (winner) => {
        if (ended) return;
        ended = true;
        clearInterval(intervalId);
        timerText.text = "00:00";

        showEndGameScreen(scene, winner, () => {
            window.location.reload();
        }, () => {
            scene.dispose();
            const homeScene = createHomeGameScene(scene.getEngine(), scene.getEngine().getRenderingCanvas(), (newScene) => {
                scene.dispose();
                newScene.render();
            });
            homeScene.render();
        });
    };

    const intervalId = setInterval(() => {
        // Vérifie le score à chaque tick
        const scores = zoneControl.getScores();
        if (scores.red >= 100 || scores.blue >= 100) {
            const winner = scores.red > scores.blue ? "rouge" : scores.blue > scores.red ? "bleue" : "égalité";
            endGame(winner);
            return;
        }

        if (totalSeconds <= 0) {
            const winner = scores.red > scores.blue ? "rouge" : scores.blue > scores.red ? "bleue" : "égalité";
            endGame(winner);
            return;
        }

        totalSeconds--;

        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        timerText.text = `${minutes}:${seconds}`;
    }, 1000);

    return {
        stop: () => clearInterval(intervalId),
        setText: (txt) => timerText.text = txt
    };
}
