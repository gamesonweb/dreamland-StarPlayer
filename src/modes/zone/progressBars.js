function createProgressBars(scene) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Barre rouge
    const redBar = new BABYLON.GUI.Rectangle();
    redBar.width = "40%";
    redBar.height = "4%";
    redBar.color = "white";
    redBar.background = "red";
    redBar.cornerRadius = 10;
    redBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    redBar.left = "5%";
    redBar.top = "5%";
    redBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(redBar);

    // Texte dans barre rouge
    const redText = new BABYLON.GUI.TextBlock();
    redText.color = "white";
    redText.fontSize = 24;
    redText.text = "0%";
    redText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    redText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    redBar.addControl(redText);

    // Barre bleue
    const blueBar = new BABYLON.GUI.Rectangle();
    blueBar.width = "40%";
    blueBar.height = "4%";
    blueBar.color = "white";
    blueBar.background = "blue";
    blueBar.cornerRadius = 10;
    blueBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    blueBar.right = "5%";
    blueBar.top = "5%";
    blueBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(blueBar);

    // Texte dans barre bleue
    const blueText = new BABYLON.GUI.TextBlock();
    blueText.color = "white";
    blueText.fontSize = 24;
    blueText.text = "0%";
    blueText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    blueText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
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
