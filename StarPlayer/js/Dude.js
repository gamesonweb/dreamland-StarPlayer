export default class Dude {
    constructor(dudeMesh, id, speed, scaling, scene) {
        this.dudeMesh = dudeMesh;
        this.id = id;
        this.scene = scene;
        this.scaling = scaling;

        if(speed)
            this.speed = speed;
        else
            this.speed = 1;

        // in case, attach the instance to the mesh itself, in case we need to retrieve
        // it after a scene.getMeshByName that would return the Mesh
        // SEE IN RENDER LOOP !
        dudeMesh.Dude = this;

        // scaling
        this.dudeMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

        // FOR COLLISIONS, let's associate a BoundingBox to the Dude

        // singleton, static property, computed only for the first dude we constructed
        // for others, we will reuse this property.
        if (Dude.boundingBoxParameters == undefined) {
            Dude.boundingBoxParameters = this.calculateBoundingBoxParameters();
        }

        this.bounder = this.createBoundingBox();
        this.bounder.dudeMesh = this.dudeMesh;
    }

    calculateBoundingBoxParameters() {
        let childrenMeshes = this.dudeMesh.getChildMeshes();
        let bbInfo = this.totalBoundingInfo(childrenMeshes);
        return bbInfo;
    }
    
    totalBoundingInfo(meshes) {
        if (!meshes || meshes.length === 0) {
            console.warn("Dude: no meshes found to compute bounding info.");
            const zero = new BABYLON.Vector3(0, 0, 0);
            return new BABYLON.BoundingInfo(zero, zero);
        }
        let boundingInfo = meshes[0].getBoundingInfo();
        let min = boundingInfo.minimum.add(meshes[0].position);
        let max = boundingInfo.maximum.add(meshes[0].position);
        for (let i = 1; i < meshes.length; i++) {
            boundingInfo = meshes[i].getBoundingInfo();
            min = BABYLON.Vector3.Minimize(min, boundingInfo.minimum.add(meshes[i].position));
            max = BABYLON.Vector3.Maximize(max, boundingInfo.maximum.add(meshes[i].position));
        }
        return new BABYLON.BoundingInfo(min, max);
    }
    
    move(scene) {
        if (!this.bounder) return;
    
        this.dudeMesh.position = this.bounder.position.clone();
    
        let tank = scene.getMeshByName("heroTank");
        if (!tank) return;
    
        let direction = tank.position.subtract(this.dudeMesh.position);
        let distance = direction.length();
        let dir = direction.normalize();
        let alpha = Math.atan2(-dir.x, -dir.z);
    
        this.dudeMesh.rotation.y = alpha;
    
        if (distance > 30) {
            this.bounder.moveWithCollisions(dir.multiplyByFloats(this.speed, this.speed, this.speed));
        }
    }
    
    
    createBoundingBox() {
        // Create a box as BoundingBox of the Dude
        let bounder = new BABYLON.Mesh.CreateBox("bounder" + (this.id).toString(), 1, this.scene);
        let bounderMaterial = new BABYLON.StandardMaterial("bounderMaterial", this.scene);
        bounderMaterial.alpha = .4;
        bounder.material = bounderMaterial;
        bounder.checkCollisions = true;

        bounder.position = this.dudeMesh.position.clone();

        let bbInfo = Dude.boundingBoxParameters;

        let max = bbInfo.boundingBox.maximum;
        let min = bbInfo.boundingBox.minimum;

        // Not perfect, but kinda of works...
        // Looks like collisions are computed on a box that has half the size... ?
        bounder.scaling.x = (max._x - min._x) * this.scaling;
        bounder.scaling.y = (max._y - min._y) * this.scaling*2;
        bounder.scaling.z = (max._z - min._z) * this.scaling*3;

        //bounder.isVisible = false;

        return bounder;
    }
}


