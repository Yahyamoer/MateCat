import getEntitiesInFragment from "./getEntitiesInFragment";
import applyEntityToContentBlock from "./applyEntityToContentBlock";
import {
    EditorState,
    Modifier,
    BlockMapBuilder
} from 'draft-js';

const duplicateFragment = (fragment, editorState) => {
    // Get all entities referenced in the fragment
    const contentState = editorState.getCurrentContent();
    const entities = getEntitiesInFragment(fragment, editorState);
    const newEntityKeys = {};

    let newEditorState = editorState;
    let contentStateWithEntity = contentState;

    // Create a clone of all entities available in fragment...
    Object.keys(entities).forEach((key) => {
        const entity = entities[key];
        contentStateWithEntity = contentStateWithEntity.createEntity(
            entity.type,
            entity.mutability,
            entity.data
        );
        // ...then match old entity keys with newly created keys
        newEntityKeys[key] = contentStateWithEntity.getLastCreatedEntityKey();
    });

    // Todo: Check on contentStateWithEntity: must be different from contentState to procede with a EditorState.push
    // Update editor history with new EditorState
    newEditorState = EditorState.push(newEditorState, contentStateWithEntity, 'adjust-depth');

    // Update all the entity references
    let newFragment = BlockMapBuilder.createFromArray([]);
    fragment.forEach((block, blockKey) => {
        let updatedBlock = block;
        newFragment = newFragment.set(blockKey, updatedBlock);
        block.findEntityRanges(
            character => character.getEntity() !== null,
            (start, end) => {
                const entityKey = block.getEntityAt(start);
                const newEntityKey = newEntityKeys[entityKey];
                updatedBlock = applyEntityToContentBlock(updatedBlock, start, end, newEntityKey);
                newFragment = newFragment.set(blockKey, updatedBlock);
            }
        );
    });

    // Insert fragment
    const newContentWithFragment = Modifier.replaceWithFragment(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection(),
        newFragment
    );

    return EditorState.push(
        newEditorState,
        newContentWithFragment,
        'insert-fragment'
    );
};

export default duplicateFragment;
