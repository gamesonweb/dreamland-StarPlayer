function showEndGameScreen(scene, winnerTeamName, onReplay, onHome) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI-End");

    // Fond semi-transparent
    const background = new BABYLON.GUI.Rectangle();
    background.width = "100%";
    background.height = "100%";
    background.background = "#000000AA";
    background.thickness = 0;
    ui.addControl(background);

    // Texte gagnant
    const winnerText = new BABYLON.GUI.TextBlock();
    winnerText.text = `L'équipe ${winnerTeamName} a gagné !`;
    winnerText.color = "white";
    winnerText.fontSize = "36px";
    winnerText.top = "-10%";
    background.addControl(winnerText);

    // Bouton Rejouer
    const replayButton = BABYLON.GUI.Button.CreateSimpleButton("replay", "Rejouer");
    replayButton.width = "150px";
    replayButton.height = "50px";
    replayButton.color = "white";
    replayButton.cornerRadius = 10;
    replayButton.background = "#4CAF50";
    replayButton.top = "10%";
    replayButton.onPointerClickObservable.add(() => {
        ui.dispose(); // supprime l'écran
        onReplay();   // action à définir
    });
    background.addControl(replayButton);

    // Bouton Accueil
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("home", "Accueil");
    homeButton.width = "150px";
    homeButton.height = "50px";
    homeButton.color = "white";
    homeButton.cornerRadius = 10;
    homeButton.background = "#2196F3";
    homeButton.top = "20%";
    homeButton.onPointerClickObservable.add(() => {
        ui.dispose();
        onHome(); // action à définir
    });
    background.addControl(homeButton);
}
