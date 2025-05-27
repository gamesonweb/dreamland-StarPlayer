export let selectedCharacter = null;
export let selectedMap = null;

export function setSelectedCharacter(character) {
    selectedCharacter = character;
}

export function setSelectedMap(map) {
    selectedMap = map;
}

export function getSelectedCharacter() {
    return selectedCharacter;
}
export function getSelectedMap() {
    return selectedMap;
}
