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

        const speed = 3;
        bullet.physicsImpostor = new BABYLON.PhysicsImpostor(bullet, BABYLON.PhysicsImpostor.SphereImpostor, {
            mass: 0.1,
            restitution: 0,
            friction: 0
        }, this.scene);

        const forward = this.gunMesh.getDirection(BABYLON.Vector3.Forward()).scale(speed);
        bullet.physicsImpostor.setLinearVelocity(forward);
        bullet.createdAt = Date.now();

        // Vérifie collisions à chaque frame (une seule fois pour cette balle)
        const checkCollision = () => {
            this.scene.meshes.forEach(mesh => {
                if (
                    mesh !== bullet &&
                    mesh.name !== this.heroMesh.name &&
                    mesh.Hp !== undefined &&
                    mesh.position &&
                    mesh.team !== this.heroMesh.team &&
                    BABYLON.Vector3.Distance(mesh.position, bullet.position) < 1.2
                ) {
                    mesh.Hp -= 500;
                    if (mesh.updateHpBar) mesh.updateHpBar();

                    if (mesh.Hp <= 0) {
                        handleDeath(mesh, this.scene);
                    }

                    bullet.dispose();
                }
            });
        };

        const observer = this.scene.onBeforeRenderObservable.add(() => {
            if (!bullet || bullet.isDisposed()) {
                this.scene.onBeforeRenderObservable.remove(observer);
                return;
            }
            checkCollision();
        });

        // Supprimer la balle au bout de 2 secondes
        setTimeout(() => {
            if (bullet && !bullet.isDisposed()) {
                bullet.dispose();
            }
            this.scene.onBeforeRenderObservable.remove(observer);
        }, bullet.lifespan);

        return bullet;
    }
    
}
