export const executeDelayAction = async (metaData: any): Promise<string> => {
    const delayValue = typeof metaData.delayValue === "number" 
        ? metaData.delayValue 
        : parseInt(metaData.delayValue || "5", 10);
    const delayUnit = typeof metaData.delayUnit === "string" 
        ? metaData.delayUnit.toLowerCase() 
        : "seconds";

    if (isNaN(delayValue) || delayValue <= 0) {
        throw new Error(`Invalid delay value: ${metaData.delayValue}`);
    }

    let delayMs = delayValue * 1000;
    if (delayUnit === "minutes") {
        delayMs = delayValue * 60 * 1000;
    } else if (delayUnit === "hours") {
        delayMs = delayValue * 60 * 60 * 1000;
    }

    console.log(`[Worker] Delaying execution for ${delayValue} ${delayUnit} (${delayMs} ms)...`);
    
    // Promisified sleep
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return `Successfully delayed workflow execution for ${delayValue} ${delayUnit}`;
};
