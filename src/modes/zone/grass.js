import {
    Scene,
    HemisphericLight,
    Vector3,
    SceneLoader,
    PhysicsAggregate,
    PhysicsShapeType,
    FollowCamera,
    AnimationGroup,
    MeshBuilder, FreeCamera, HavokPlugin,
} from "@babylonjs/core";
import { getSelectedCharacter } from "../../gameState.js";
import HavokPhysics from "@babylonjs/havok";
import {FireGun, Sword} from "../../weapon.js";
import {createProgressBars} from "./progressBars.js";
import {setupZoneControl} from "./zone.js";
import {createGameTimerUI} from "../../timer.js";
import {addCloneAI} from "./teams.js";

// État clavier global
const inputStates = {
    up: false,
    down: false,
    left: false,
    right: false,
    keyF: false,
};

function setupInput(scene) {
    scene.onKeyboardObservable.add((kbInfo) => {
        const pressed = kbInfo.type === 1; // 1 = KEYDOWN, 2 = KEYUP
        switch (kbInfo.event.key) {
            case "z":
            case "ArrowUp":
                inputStates.up = pressed;
                break;
            case "s":
            case "ArrowDown":
                inputStates.down = pressed;
                break;
            case "q":
            case "ArrowLeft":
                inputStates.left = pressed;
                break;
            case "d":
            case "ArrowRight":
                inputStates.right = pressed;
                break;
            case "f":
                inputStates.keyF = pressed;
                break;
        }
    });
}



export async function createGrassScene(engine, canvas, setScene) {
    const scene = new Scene(engine);
    // Caméra
    let camera = new FreeCamera("freeCamera", new Vector3(0, 10, 0), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();

    const havok = await HavokPhysics({
        locateFile: (file) => "assets/HavokPhysics.wasm"
    });
    const hk = new HavokPlugin(true, havok);
    scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    setupInput(scene);

    let playerMesh = null;
    let playerAnimations = null;
    let followCamera = null;
    let weapon = null;

    const character = getSelectedCharacter();
    // À placer dans le scope principal (en haut) :
    const projectiles = [];


    // Initialisation des équipes
    const teams = {
        red: [],
        blue: []
    };

// Crée la zone de capture
    const zoneController = setupZoneControl(scene, teams);
    const timerUI = createGameTimerUI(scene, zoneController);

    SceneLoader.ImportMesh("", "models/map/", "Dueling-Beetles.glb", scene, (meshes) => {
        meshes.forEach(mesh => {
            if (mesh.getTotalVertices() > 0) {
                console.log(mesh.name);
                if (mesh.name === "Sol") {
                    mesh.checkCollisions = true;
                    new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.3 }, scene);
                }
                if (mesh.name.startsWith("Brique_") || mesh.name.startsWith("Beton_")) {
                    mesh.checkCollisions = true;
                    new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.3 }, scene);
                }
            }
        });
        if (character) {
            SceneLoader.ImportMesh("", character.modelPath, character.modelFile, scene, (meshes, _, skeletons, animationGroups) => {
                playerMesh = meshes[0];
                playerMesh.name = "PlayerMesh";
                playerMesh.checkCollisions = true;
                playerMesh.showBoundingBox = true;
                playerMesh.position = new Vector3(0, 0, 32);
                playerMesh.scaling = new Vector3(2, 2, 2);

                // Collision physique
                //new PhysicsAggregate(playerMesh, PhysicsShapeType.CAPSULE, { mass: 0 }, scene);

                // Animations
                playerAnimations = animationGroups;

                // Caméra suiveuse
                followCamera = new FollowCamera("followCamera", new Vector3(0, 10, -10), scene);
                followCamera.lockedTarget = playerMesh;
                followCamera.radius = 10;
                followCamera.heightOffset = 40;
                followCamera.rotationOffset = 180;
                followCamera.inputs.clear();
                scene.activeCamera = followCamera;

                switch (character.weaponType) {
                    case "gun":
                        weapon = new FireGun(meshes.find(mesh => mesh.name.includes("Gun")),playerMesh,  scene);
                        break;
                    case "sword":
                        weapon = new Sword(playerMesh, scene);
                        break;
                    default:
                        console.warn("Type d'arme inconnu :", character.weaponType);
                }

                teams.blue.push(playerMesh);

// Crée deux clones pour l'équipe bleue
                for (let i = 0; i < 2; i++) {
                    const clone = playerMesh.clone(`blueClone${i}`);
                    clone.position = playerMesh.position.add(new Vector3(i + 1, 0, 0));
                    teams.blue.push(clone);
                    addCloneAI(clone, teams.red, scene, "blue", projectiles); // 👈 Ajout IA
                }

                // Crée trois clones pour l'équipe rouge
                for (let i = 0; i < 3; i++) {
                    const clone = playerMesh.clone(`redClone${i}`);
                    clone.position = playerMesh.position.add(new Vector3(-i - 1, 0, -40));
                    teams.red.push(clone);
                    addCloneAI(clone, teams.blue, scene, "red", projectiles); // 👈 Ajout IA
                }


            });
        }
    });
    const progressBars = createProgressBars(scene);

// Pour tester temporairement (met à jour chaque frame avec des valeurs fictives)
    let testProgress = 0;
    // Boucle de déplacement
    scene.onBeforeRenderObservable.add(() => {
        if (!playerMesh) return;

        const moveSpeed = 0.1;
        let moved = false;

        if (inputStates.left) {
            playerMesh.moveWithCollisions(new Vector3(moveSpeed, 0, 0));
            playerMesh.rotation.y = Math.PI / 2;
            moved = true;
        }
        if (inputStates.right) {
            playerMesh.moveWithCollisions(new Vector3(-moveSpeed, 0, 0));
            playerMesh.rotation.y = -Math.PI / 2;
            moved = true;
        }
        if (inputStates.up) {
            playerMesh.moveWithCollisions(new Vector3(0, 0, -moveSpeed));
            playerMesh.rotation.y = 0;
            moved = true;
        }
        if (inputStates.down) {
            playerMesh.moveWithCollisions(new Vector3(0, 0, moveSpeed));
            playerMesh.rotation.y = Math.PI;
            moved = true;
        }

        if (weapon) {
            weapon.fire(inputStates);
        }

        if (playerAnimations && playerAnimations.length > 0) {
            const walkAnim = playerAnimations.find(anim => anim.name.toLowerCase().includes("walk") || anim.name.toLowerCase().includes("run"));
            if (walkAnim) {
                if (moved) {
                    walkAnim.start(true);
                } else {
                    walkAnim.stop();
                }
            }
        }

        zoneController.update();
        const scores = zoneController.getScores();
        progressBars.update(scores.red, scores.blue, 100);

    });



    return scene;
}
