import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/";
import {
    ArcRotateCamera,
    Color3,
    Engine,
    FollowCamera,
    FreeCamera,
    HavokPlugin,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";

import Tank from "./tank";
//import Dude from "./Dude"

import HavokPhysics from "@babylonjs/havok";

class App {
    engine: Engine;
    scene: Scene;
    canvas: HTMLCanvasElement;
    inputStates: {
        keyF: boolean;
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
    };
    freeCamera: FreeCamera;
    tank: Tank;
    heroMesh: Mesh;
    heroSkeleton: any;
    heroAnimations: any;
    gunMesh: any;
    canFire: boolean = true;

    followCamera: FollowCamera;
    // Physics engine
    havokInstance;
    //dudes: Dude[];




    constructor() {
        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);

        this.inputStates = {
            left: false,
            right: false,
            up: false,
            down: false,
            keyF: false,
        };

        // initialize babylon scene and engine
        this.engine = new Engine(this.canvas, true);
    }

    async start() {
        await this.initGame()
        this.gameLoop();
        this.endGame();
    }

    //async getInitializedHavok() {
    //return await HavokPhysics();
    //}

    private async getInitializedHavok() {
        // locates the wasm file copied during build process
        const havok = await HavokPhysics({
            locateFile: (file) => {
                return "assets/HavokPhysics.wasm"
            }
        });
        return havok;
    }

    async initGame() {
        this.havokInstance = await this.getInitializedHavok();

        this.scene = this.createScene();

        this.modifySettings(this.scene, this.inputStates);
    }

    endGame() {

    }

    gameLoop() {
        const divFps = document.getElementById("fps");

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";

            // === Déplacement du perso ===
            if (this.heroMesh && this.heroSkeleton) {
                const moveSpeed = 0.1;
                let moved = false;
                if (this.inputStates.left) {
                    this.heroMesh.moveWithCollisions(new Vector3(moveSpeed, 0, 0));
                    this.heroMesh.rotation.y = Math.PI / 2;
                    moved = true;
                }
                if (this.inputStates.right) {
                    this.heroMesh.moveWithCollisions(new Vector3(-moveSpeed, 0, 0));
                    this.heroMesh.rotation.y = -Math.PI / 2;
                    moved = true;
                }
                if (this.inputStates.up) {
                    this.heroMesh.moveWithCollisions(new Vector3(0, 0, -moveSpeed));
                    this.heroMesh.rotation.y = Math.PI;
                    moved = true;
                }
                if (this.inputStates.down) {
                    this.heroMesh.moveWithCollisions(new Vector3(0, 0, moveSpeed));
                    this.heroMesh.rotation.y = 0;
                    moved = true;
                }

                // Play the animation if the character is moving
                if (moved) {
                    this.heroAnimations[1].start(true, 1.0, this.heroAnimations[1].from, this.heroAnimations[1].to, true);
                } else {
                    // Stop the animation if the character is not moving
                    this.heroAnimations[1].stop();
                }

                if(this.inputStates.keyF) {
                    this.fireGun(this.inputStates, this.scene);
                }
            }
        });
    }

    createScene() {
        let scene = new Scene(this.engine);

        // initialize the plugin using the HavokPlugin constructor
        const hk = new HavokPlugin(true, this.havokInstance);
        // enable physics in the scene with a gravity
        scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        //camera.attachControl(this.canvas, true);
        let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        this.createGround(scene);

        this.createHero(scene);

        // Use free camera for the moment
        this.freeCamera = this.createFreeCamera(scene, this.canvas);
        scene.activeCamera = this.freeCamera;

        // Une box gérée par le moteur physique
        let boxDebug = MeshBuilder.CreateBox("boxDebug", { width: 5, depth: 5, height: 5 });
        boxDebug.position = new Vector3(10, 30, 5);

        return scene;
    }

    createTank(scene) {
        this.tank = new Tank(scene);
    }

    createHero(scene) {
        // load the Dude 3D animated model
        // name, folder, skeleton name 
        SceneLoader.ImportMesh("", "models/personnages/", "perso1.glb", scene, (newMeshes, particleSystems, skeletons,animationGroups) => {
            this.heroMesh = newMeshes[0];
            this.heroMesh.checkCollisions = true;
            this.heroMesh.showBoundingBox = true;
            this.heroMesh.position = new Vector3(11, 0, 32);
            this.heroMesh.scaling = new Vector3(2, 2, 2);
            this.heroMesh.name = "perso1";

            this.heroSkeleton = skeletons[0];
            this.heroAnimations = animationGroups;

            this.gunMesh = newMeshes.find(mesh => mesh.name.includes("Gun"));
            if (this.gunMesh) {
                this.gunMesh.isPickable = false;
                console.log("Gun trouvé :", this.gunMesh.name);
                this.gunMesh.showBoundingBox = false;
            } else {
                console.warn("Gun non trouvé dans le perso");
            }
            this.followCamera = this.createFollowCamera(scene, this.heroMesh);
            scene.activeCamera = this.followCamera;

        });
    }

    fireGun(inputStates, scene) {
        if (!inputStates.keyF || !this.gunMesh || !this.canFire) return;

        this.canFire = false;
        setTimeout(() => this.canFire = true, 1000 * 0.3); // cooldown de 300ms

        const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.3 }, scene);
        bullet.material = new StandardMaterial("bulletMat", scene);
        bullet.material.diffuseColor = new Color3(1, 1, 0); // jaune

        bullet.position = this.gunMesh.getAbsolutePosition().add(new Vector3(0, 0.2, 0)); // un peu au-dessus du gun
        const direction = this.gunMesh.forward || this.heroMesh.forward || new Vector3(0, 0, 1);

        // physique et impulsion simple
        const bulletAgg = new PhysicsAggregate(bullet, PhysicsShapeType.SPHERE, { mass: 0.2 }, scene);
        const impulse = direction.scale(50);
        bulletAgg.body.applyImpulse(impulse, bullet.getAbsolutePosition());

        setTimeout(() => bullet.dispose(), 3000);
    }

    createFreeCamera(scene, canvas) {
        let camera = new FreeCamera("freeCamera", new Vector3(0, 50, 0), scene);
        //camera.attachControl(canvas,false);
        // prevent camera to cross ground
        camera.checkCollisions = true;
        // avoid flying with the camera
        camera.applyGravity = true;
        return camera;
    }

    createFollowCamera(scene, target) {
        let camera = new FollowCamera("tankFollowCamera", target.position, scene, target);

        camera.radius = 10; // how far from the object to follow
        camera.heightOffset = 10; // how high above the object to place the camera
        camera.rotationOffset = 180; // the viewing angle
        camera.cameraAcceleration = .1; // how fast to move
        camera.maxCameraSpeed = 5; // speed limit
        camera.pitchOffset = -120;

        return camera;
    }

    createGround(scene: Scene) {
        SceneLoader.ImportMesh("", "models/map/", "Dueling-Beetles.glb", scene, function (meshes, particleSystems, skeletons, animationGroups, transformNodes) {
            meshes.forEach(mesh => {
                if (mesh.getTotalVertices() > 0) {
                    console.log("Mesh chargé :", mesh.name);
                    if(mesh.name === "Sol") {
                        mesh.checkCollisions = true;
                        mesh.showBoundingBox = false;
                        mesh.physicsImpostor = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.3 }, scene);
                }
                    // Gérer les briques
                    if (mesh.name.startsWith("Brique_")) {
                        mesh.checkCollisions = true;
                        mesh.physicsImpostor = new PhysicsAggregate(
                            mesh,
                            PhysicsShapeType.MESH,
                            { mass: 0, restitution: 0.3 },
                            scene
                        );
                    }

                    // Gérer les bétons
                    if (mesh.name.startsWith("Beton_")) {
                        mesh.checkCollisions = true;
                        mesh.physicsImpostor = new PhysicsAggregate(
                            mesh,
                            PhysicsShapeType.MESH,
                            { mass: 0, restitution: 0.3 },
                            scene
                        );
                    }
                } else {
                    console.warn("Mesh vide ignoré :", mesh.name);
                }
            });

        });
    }


    modifySettings(scene, inputStates) {
        // as soon as we click on the game window, the mouse pointer is "locked"
        // you will have to press ESC to unlock it
        this.scene.onPointerDown = () => {
            if (!scene.alreadyLocked) {
                console.log("requesting pointer lock");
                this.canvas.requestPointerLock();
            } else {
                console.log("Pointer already locked");
            }
        }

        window.addEventListener("resize", () => {
            console.log("resize");
            this.engine.resize()
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.key === "I" || ev.key === "i") {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        document.addEventListener("pointerlockchange", () => {
            let element = document.pointerLockElement || null;
            if (element) {
                // lets create a custom attribute
                scene.alreadyLocked = true;
            } else {
                scene.alreadyLocked = false;
            }
        })

        // key listeners for the tank
        inputStates.left = false;
        inputStates.right = false;
        inputStates.up = false;
        inputStates.down = false;
        inputStates.space = false;

        //add the listener to the main, window object, and update the states
        window.addEventListener('keydown', (event) => {
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = true;
                event.preventDefault();
            } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = true;
                event.preventDefault();
            } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = true;
                event.preventDefault();
            } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = true;
                event.preventDefault();
            } else if (event.key === " ") {
                inputStates.space = true;
                event.preventDefault();
            } else if (event.key === "f") {
                inputStates.keyF = true;
                event.preventDefault();
            }
        }, false);

        //if the key will be released, change the states object 
        window.addEventListener('keyup', (event) => {
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = false;
                event.preventDefault();
            } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = false;
                event.preventDefault();
            } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = false;
                event.preventDefault();
            } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = false;
                event.preventDefault();
            } else if (event.key === " ") {
                inputStates.space = false;
                event.preventDefault();
            } else if (event.key === "f") {
                inputStates.keyF = false;
                event.preventDefault();
            }

        }, false);
    }
}


const gameEngine = new App();
gameEngine.start();

