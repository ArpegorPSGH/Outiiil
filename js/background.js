function setImages(blobs) {
    window.OUTIIIL_DYNAMIC_IMAGES = blobs;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_SCRIPT') {
        if (message.funcName === 'executeCode') {
            // Use data URL to execute code in isolated world - bypasses CSP eval restrictions
            function executeViaDataUrl(code) {
                const url = 'data:text/javascript,' + encodeURIComponent(code);
                const script = document.createElement('script');
                script.src = url;
                (document.head || document.documentElement).appendChild(script);
            }
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: executeViaDataUrl,
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