class Weapon {
    constructor(gunMesh, heroMesh, scene) {
        this.gunMesh = gunMesh;
        this.heroMesh = heroMesh;
        this.scene = scene;
        this.canFire = true;
    }

    fire(inputStates) {
        // Méthode vide, à surcharger dans les classes dérivées
        console.warn("La méthode fire doit être implémentée dans la classe dérivée.");
    }
}

// Arme pistolet héritant de Weapon
class FireGun extends Weapon {
    fire(ignoreCooldown = false) {
        if (!this.gunMesh || (!this.canFire && !ignoreCooldown)) return;

        if (!ignoreCooldown) {
            this.canFire = false;
            setTimeout(() => this.canFire = true, 300);
        }

        this.gunMesh.computeWorldMatrix(true);
        const gunPos = this.gunMesh.getAbsolutePosition().clone();

        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", { diameter: 0.3 }, this.scene);
        bullet.material = new BABYLON.StandardMaterial("bulletMat", this.scene);
        bullet.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
        bullet.position = gunPos.add(new BABYLON.Vector3(0, 0.2, 0));
        bullet.lifespan = 2000;

        const direction = this.gunMesh.getDirection(new BABYLON.Vector3(0, 0, 1)).normalize();
        const speed = 3;

        bullet.physicsImpostor = new BABYLON.PhysicsImpostor(
            bullet,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 0.1, restitution: 0 },
            this.scene
        );

        bullet.physicsImpostor.setLinearVelocity(direction.scale(speed));

        // Vérifie les collisions avec tous les ennemis
        this.scene.registerBeforeRender(() => {
            this.scene.meshes.forEach(mesh => {
                if (
                    mesh !== bullet &&
                    mesh.name !== this.heroMesh.name &&
                    mesh.Hp !== undefined &&
                    mesh.position &&
                    BABYLON.Vector3.Distance(mesh.position, bullet.position) < 1.2
                ) {
                    // Touche le mesh : inflige des dégâts
                    mesh.Hp -= 10;
                    if (mesh.updateHpBar) mesh.updateHpBar();
                    bullet.dispose();
                }
            });
        });

        // Détruire la balle après 2 secondes
        setTimeout(() => {
            if (bullet && bullet.dispose) bullet.dispose();
        }, bullet.lifespan);

        return bullet;
    }
}

class Sword extends Weapon {
    fire(inputStates) {
        if (!inputStates.keyF || !this.gunMesh || !this.canFire) return;

        this.canFire = false;
        setTimeout(() => this.canFire = true, 500); // cooldown 500ms

        const swordSwing = BABYLON.MeshBuilder.CreateBox("swordSwing", {size: 0.5}, this.scene);
        swordSwing.material = new BABYLON.StandardMaterial("swordMat", this.scene);
        swordSwing.material.diffuseColor = new Color3(1, 0, 0); // rouge

        swordSwing.position = this.gunMesh.getAbsolutePosition().add(new BABYLON.Vector3(0, 0.2, 0));

        const direction = this.gunMesh.forward || this.heroMesh.forward || new BABYLON.Vector3(0, 0, 1);

        const swordAgg = new BABYLON.PhysicsImpostor(swordSwing, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, this.scene);
        const impulse = direction.scale(30);
        swordAgg.body.applyImpulse(impulse, swordSwing.getAbsolutePosition());

        setTimeout(() => swordSwing.dispose(), 1000);
}



}
