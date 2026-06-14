export const executeTransformAction = async (metaData: any): Promise<string> => {
    const input = typeof metaData.input === "string" ? metaData.input : "";
    const operation = typeof metaData.operation === "string" 
        ? metaData.operation.toLowerCase() 
        : "uppercase";

    console.log(`[Worker] Running transform operation "${operation}" on input: "${input}"`);

    switch (operation) {
        case "custom":
            return input;
        case "uppercase":
            return input.toUpperCase();
        case "lowercase":
            return input.toLowerCase();
        case "trim":
            return input.trim();
        case "replace": {
            const searchText = typeof metaData.searchText === "string" ? metaData.searchText : "";
            const replaceText = typeof metaData.replaceText === "string" ? metaData.replaceText : "";
            if (!searchText) {
                return input;
            }
            // Global search & replace using split-join
            return input.split(searchText).join(replaceText);
        }
        case "append": {
            const appendText = typeof metaData.appendText === "string" ? metaData.appendText : "";
            return input + appendText;
        }
        case "prepend": {
            const prependText = typeof metaData.prependText === "string" ? metaData.prependText : "";
            return prependText + input;
        }
        default:
            throw new Error(`Unsupported transform operation: ${operation}`);
    }
};
