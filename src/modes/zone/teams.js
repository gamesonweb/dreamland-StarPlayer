function addCloneAI(clone, enemies, scene, team, projectiles) {
    const speed = 0.03;
    const shootCooldown = 1000;
    let lastShotTime = 0;

    scene.onBeforeRenderObservable.add(() => {
        if (!clone) return;

        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of enemies) {
            const distance = BABYLON.Vector3.Distance(clone.position, enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy) {
            const direction = closestEnemy.position.subtract(clone.position).normalize();
            clone.moveWithCollisions(direction.scale(speed));

            const now = Date.now();
            if (closestDistance < 6 && now - lastShotTime > shootCooldown) {
                fireProjectile(clone, direction, scene, team, projectiles);
                lastShotTime = now;
            }
        }
    });
}

function fireProjectile(origin, direction, scene, team, projectiles) {
    const projectile = BABYLON.MeshBuilder.CreateSphere("projectile", { diameter: 0.3 }, scene);
    projectile.position = origin.position.clone().add(new BABYLON.Vector3(0, 1, 0));
    const mat = new BABYLON.StandardMaterial("projMat", scene);
    mat.diffuseColor = team === "red" ? BABYLON.Color3.Red() : BABYLON.Color3.Blue();
    projectile.material = mat;

    const velocity = direction.scale(0.3);

    scene.onBeforeRenderObservable.add(() => {
        if (!projectile) return;
        projectile.position.addInPlace(velocity);
    });

    projectiles.push(projectile);
}
