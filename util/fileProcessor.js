import init, { store_file, parse_file } from '../rs/pkg/rs.js'

class FileProcessor {
    constructor() {
        this.wasmInitialized = false;
        this.nextFileId = 0;
        this.storedFiles = new Map();
    }

    async initialize() {
        if (!this.wasmInitialized) {
            await init();
            this.wasmInitialized = true;
            console.log("WASM initialized");
        }
    }

    async storeFile(file) {
        if (!this.wasmInitialized) {
            throw new Error('WASM not initialized');
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const fileId = this.nextFileId++;
        store_file(fileId, uint8Array);

        this.storedFiles.set(fileId, {
            name: file.name,
            size: uint8Array.length
        });

        console.log(`JS: stored file ${fileId}: ${file.name} (${uint8Array.length} bytes)`);
        return fileId;

    }

    removeFile(fileId) {
        console.warn(`JS: removeFile not implimented`);
        return;

        //if (!this.storedFiles.has(fileId)){
        //    console.warn(`JS: file ${fileId} not found`);
        //    return; 
        //}

        //this.storedFiles.delete(fileId);
    }

    async parseFile(fileId) {
        if (!this.wasmInitialized) {
            throw new Error('WASM not initialized');
        }

        if (!this.storedFiles.has(fileId)) {
            throw new Error(`File ${fileId} not found`);
        }

        const fileInfo = this.storedFiles.get(fileId);
        console.log(`JS: parsing file ${fileId}: ${fileInfo.name}`);
        
        const result = parse_file(fileId, fileInfo.name);
        return result;
    }

}

export default FileProcessor;
