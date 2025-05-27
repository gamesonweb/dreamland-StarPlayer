import { Color3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, StandardMaterial, Vector3 } from "@babylonjs/core";

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
export class FireGun extends Weapon {
    fire(inputStates) {
        if (!inputStates.keyF || !this.gunMesh || !this.canFire) return;

        this.canFire = false;
        setTimeout(() => this.canFire = true, 300); // cooldown 300ms

        const bullet = MeshBuilder.CreateSphere("bullet", {diameter: 0.3}, this.scene);
        bullet.material = new StandardMaterial("bulletMat", this.scene);
        bullet.material.diffuseColor = new Color3(1, 1, 0); // jaune

        bullet.position = this.gunMesh.getAbsolutePosition().add(new Vector3(0, 0.2, 0));

        const direction = this.gunMesh.forward || this.heroMesh.forward || new Vector3(0, 0, 1);

        const bulletAgg = new PhysicsAggregate(bullet, PhysicsShapeType.SPHERE, {mass: 0.2}, this.scene);
        const impulse = direction.scale(50);
        bulletAgg.body.applyImpulse(impulse, bullet.getAbsolutePosition());

        setTimeout(() => bullet.dispose(), 3000);
    }
}

export class Sword extends Weapon {
    fire(inputStates) {
        if (!inputStates.keyF || !this.gunMesh || !this.canFire) return;

        this.canFire = false;
        setTimeout(() => this.canFire = true, 500); // cooldown 500ms

        const swordSwing = MeshBuilder.CreateBox("swordSwing", {size: 0.5}, this.scene);
        swordSwing.material = new StandardMaterial("swordMat", this.scene);
        swordSwing.material.diffuseColor = new Color3(1, 0, 0); // rouge

        swordSwing.position = this.gunMesh.getAbsolutePosition().add(new Vector3(0, 0.2, 0));

        const direction = this.gunMesh.forward || this.heroMesh.forward || new Vector3(0, 0, 1);

        const swordAgg = new PhysicsAggregate(swordSwing, PhysicsShapeType.BOX, {mass: 1}, this.scene);
        const impulse = direction.scale(30);
        swordAgg.body.applyImpulse(impulse, swordSwing.getAbsolutePosition());

        setTimeout(() => swordSwing.dispose(), 1000);
}



}
