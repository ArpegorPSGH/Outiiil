function executeCode(code) {
    // Inject code via script element to avoid CSP eval restrictions
    const script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

function setImages(blobs) {
    window.OUTIIIL_DYNAMIC_IMAGES = blobs;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_SCRIPT') {
        if (message.funcName === 'executeCode') {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: executeCode,
                args: message.args
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