function executeCode(code) {
    eval(code);
}

function setImages(blobs) {
    window.OUTIIIL_DYNAMIC_IMAGES = blobs;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_SCRIPT') {
        const funcMap = {
            'executeCode': executeCode,
            'setImages': setImages
        };
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: funcMap[message.funcName],
            args: message.args
        }).then(() => sendResponse(true)).catch(sendResponse);
        return true;
    }
});