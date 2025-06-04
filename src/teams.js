function addCloneAI(clone, enemies, scene, team, projectiles, teams) {
    const speed = 0.05;
    const shootCooldown = 1000;
    let lastShotTime = 0;

    const aiCallback = () => {
        if (!clone || !clone.isVisible) return;

        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of enemies) {
            if (!enemy || !enemy.isVisible) continue;
            const distance = BABYLON.Vector3.Distance(clone.position, enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy) {
            const direction = closestEnemy.position.subtract(clone.position).normalize();
            clone.moveWithCollisions(direction.scale(speed));
            const physicsImpostor = clone.physicsImpostor;
            if (physicsImpostor) {
                const directionForce = direction.scale(speed * 10);
                physicsImpostor.applyImpulse(directionForce, clone.getAbsolutePosition());
            }

            if (clone.animations) {
                playAnimationByName(clone, "Run", true);
            }

            const now = Date.now();
            if (closestDistance < 6 && now - lastShotTime > shootCooldown) {
                playAnimationByName(clone, "Shoot", false);
                fireProjectile(clone, direction, scene, team, projectiles, teams);
                lastShotTime = now;
            }
        } else {
            if (clone.animations) {
                playAnimationByName(clone, "Pose", true);
            }
        }
    };

    scene.onBeforeRenderObservable.add(aiCallback);

    return aiCallback;
}
function fireProjectile(origin, direction, scene, team, projectiles, teams) {
    const projectile = BABYLON.MeshBuilder.CreateSphere("projectile", { diameter: 0.3 }, scene);
    projectile.position = origin.position.clone().add(new BABYLON.Vector3(0, 1, 0));
    projectile.isPickable = false;

    const mat = new BABYLON.StandardMaterial("projMat", scene);
    mat.diffuseColor = team === "red" ? BABYLON.Color3.Red() : BABYLON.Color3.Blue();
    projectile.material = mat;

    const velocity = direction.scale(1);
    projectiles.push(projectile);

    // Lier le projectile au clone pour pouvoir nettoyer à la mort
    if (!origin.projectiles) origin.projectiles = [];
    origin.projectiles.push(projectile);

    // Mouvement
    const moveCallback = () => {
        projectile.position.addInPlace(velocity);
    };
    scene.onBeforeRenderObservable.add(moveCallback);

    // Collision logique
    const enemies = team === "red" ? teams.blue : teams.red;

    const checkHitInterval = setInterval(() => {
        for (const enemy of enemies) {
            if (!enemy || !enemy.isVisible) continue;

            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            if (distance < 1.5) {
                dealDamage(enemy, 1000, scene, teams);
                projectile.dispose();
                clearInterval(checkHitInterval);
                scene.onBeforeRenderObservable.remove(moveCallback);
                return;
            }
        }

        if (projectile.position.length() > 1000) {
            projectile.dispose();
            clearInterval(checkHitInterval);
            scene.onBeforeRenderObservable.remove(moveCallback);
        }
    }, 50);
}

function dealDamage(target, amount, scene, teams) {
    if (target.Hp === undefined) return;

    target.Hp -= amount;
    target.updateHpBar();

    if (target.Hp <= 0) {
        handleDeath(target, scene, teams);
    }
}
function handleDeath(mesh, scene, teams) {
    // Désactivation du mesh et UI
    mesh.setEnabled(false);
    mesh.isVisible = false;

    if (mesh.hpGui) {
        mesh.hpGui.hpBarContainer.isVisible = false;
        mesh.hpGui.hpFloatingText.isVisible = false;
    }

    if (mesh.ammoBar) {
        mesh.ammoBar.ammoBarContainer.isVisible = false;
    }

    // Supprimer physics impostor
    if (mesh.physicsImpostor) {
        mesh.physicsImpostor.dispose();
        mesh.physicsImpostor = null;
    }

    // Supprimer callback IA
    if (mesh.aiCallback) {
        scene.onBeforeRenderObservable.remove(mesh.aiCallback);
        mesh.aiCallback = null;
    }

    // Supprimer projectiles liés
    if (mesh.projectiles) {
        for (const p of mesh.projectiles) {
            p.dispose();
        }
        mesh.projectiles = [];
    }

    if (mesh.isPlayer) {
        playerAlive = false;
        enterSpectatorMode(scene, mesh.team, teams);
    }

    showDeathMessage(mesh, scene, 10);

    // Réapparition
    setTimeout(() => {
        if (gameOver) return;

        mesh.Hp = mesh.maxHp;
        mesh.updateHpBar();
        mesh.position = mesh.spawnPosition.clone();
        mesh.setEnabled(true);
        mesh.isVisible = true;

        if (mesh.hpGui) {
            mesh.hpGui.hpBarContainer.isVisible = true;
            mesh.hpGui.hpFloatingText.isVisible = true;
        }

        if (mesh.ammoBar) {
            mesh.ammoBar.ammoBarContainer.isVisible = true;
        }

        if (mesh.isPlayer) {
            playerAlive = true;
            if (mesh.camera) {
                scene.activeCamera = mesh.camera;
                mesh.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
            }
        }

        // Remettre physics impostor si nécessaire (à recréer)
        if (!mesh.physicsImpostor) {
            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);
        }

        
        //mesh.aiCallback = addCloneAI(mesh, teams[mesh.team === "red" ? "blue" : "red"], scene, mesh.team, projectilesGlobal, teams);

    }, 10000);
}

    function showDeathMessage(mesh, scene, seconds) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI-Death");

    const message = new BABYLON.GUI.TextBlock();
    message.color = "white";
    message.fontSize = "24px";
    message.top = "-20%";

    if (mesh.isPlayer) {
        message.text = `Vous êtes mort ! Réapparition dans ${seconds} secondes...`;
    } else {
        message.text = `Un clone de l’équipe ${mesh.team} est mort.\nRéapparition dans ${seconds} secondes...`;
    }

    ui.addControl(message);

    let remaining = seconds;
    const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            ui.dispose();
            clearInterval(interval);
        } else {
            message.text = mesh.isPlayer ?
                `Vous êtes mort ! Réapparition dans ${remaining} secondes...` :
                `Un clone de l’équipe ${mesh.team} est mort.\nRéapparition dans ${remaining} secondes...`;
        }
    }, 1000);
}
function enterSpectatorMode(scene, team, teams) {
    const allies = team === "red" ? teams.red : teams.blue;
    const aliveClone = allies.find(clone => clone && clone.isVisible);

    if (aliveClone) {
        const specCamera = createFollowCamera(scene, aliveClone);
        scene.activeCamera = specCamera;
        specCamera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    }
}

