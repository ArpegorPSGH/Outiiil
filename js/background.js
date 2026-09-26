function setImages(blobs) {
    window.OUTIIIL_DYNAMIC_IMAGES = blobs;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_SCRIPT') {
        if (message.funcName === 'executeCode') {
            // Use code parameter instead of func to avoid CSP eval violation
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                code: message.args[0]
            }).then(() => sendResponse(true)).catch(sendResponse);
        } else if (message.funcName === 'setImages') {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: setImages,
                args: message.args
            }).then(() => sendResponse(true)).catch(sendResponse);
        }
        return true;
    }
});