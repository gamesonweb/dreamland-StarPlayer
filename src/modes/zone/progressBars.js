import { AdvancedDynamicTexture, Rectangle, Control, TextBlock } from "@babylonjs/gui";

export function createProgressBars(scene) {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Barre rouge
    const redBar = new Rectangle();
    redBar.width = "40%";
    redBar.height = "4%";
    redBar.color = "white";
    redBar.background = "red";
    redBar.cornerRadius = 10;
    redBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    redBar.left = "5%";
    redBar.top = "5%";
    redBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(redBar);

    // Texte dans barre rouge
    const redText = new TextBlock();
    redText.color = "white";
    redText.fontSize = 24;
    redText.text = "0%";
    redText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    redText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    redBar.addControl(redText);

    // Barre bleue
    const blueBar = new Rectangle();
    blueBar.width = "40%";
    blueBar.height = "4%";
    blueBar.color = "white";
    blueBar.background = "blue";
    blueBar.cornerRadius = 10;
    blueBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    blueBar.right = "5%";
    blueBar.top = "5%";
    blueBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(blueBar);

    // Texte dans barre bleue
    const blueText = new TextBlock();
    blueText.color = "white";
    blueText.fontSize = 24;
    blueText.text = "0%";
    blueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    blueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    blueBar.addControl(blueText);

    return {
        update: (redScore, blueScore, maxScore = 100) => {
            const redPercent = Math.min(redScore / maxScore, 1);
            const bluePercent = Math.min(blueScore / maxScore, 1);

            redBar.width = `${redPercent * 40}%`;
            blueBar.width = `${bluePercent * 40}%`;

            // Affiche score ou pourcentage sur la barre
            redText.text = `${Math.floor(redPercent * 100)}%`;
            blueText.text = `${Math.floor(bluePercent * 100)}%`;
        }
    };
}
