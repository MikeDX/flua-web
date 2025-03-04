// Import example scripts
import particlesScript from './examples/particles.lua';

// Example scripts collection
export const examples = {
    particles: particlesScript
};

// Function to load an example script into the editor
export function loadExample(name: string, editorElement: HTMLTextAreaElement): void {
    if (examples[name as keyof typeof examples]) {
        editorElement.value = examples[name as keyof typeof examples];
    } else {
        console.error(`Example '${name}' not found`);
    }
} 