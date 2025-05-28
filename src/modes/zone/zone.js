function getTeamColorBlend(redScore, blueScore) {
    const total = redScore + blueScore;
    if (total === 0) return new BABYLON.Color3(1, 1, 0); // Jaune par défaut
    const redRatio = redScore / total;
    const blueRatio = blueScore / total;

    // Interpolation entre rouge et bleu
    return new BABYLON.Color3(
        redRatio,
        0,
        blueRatio
    );
}

function setupZoneControl(scene, teams) {
    const zone = BABYLON.MeshBuilder.CreateCylinder("zone", { diameter: 13, height: 0.1 }, scene);
    zone.position.y = 0;

    const mat = new BABYLON.StandardMaterial("zoneMat", scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 0);
    mat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    zone.material = mat;

    let redScore = 0;
    let blueScore = 0;

    return {
        update: () => {
            let redCount = 0, blueCount = 0;

            teams.red.forEach(p => {
                if (p.intersectsMesh(zone, false)) redCount++;
            });
            teams.blue.forEach(p => {
                if (p.intersectsMesh(zone, false)) blueCount++;
            });

            if (redCount > blueCount) redScore += 0.07;
            else if (blueCount > redCount) blueScore += 0.07;

            mat.diffuseColor = getTeamColorBlend(redScore, blueScore);
        },
        getScores: () => ({ red: redScore, blue: blueScore })
    };
}
