// 后台脚本，处理弹窗固定功能
let isPinned = false;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'pinPopup') {
    isPinned = request.pinned;
    console.log('弹窗固定状态:', isPinned);
  }
});

// 监听标签页更新事件，防止弹窗关闭
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (isPinned && changeInfo.status === 'complete') {
    // 如果弹窗被固定，保持它打开
    chrome.action.openPopup();
  }
});

// 监听窗口焦点变化事件
chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (isPinned && windowId !== chrome.windows.WINDOW_ID_NONE) {
    // 如果弹窗被固定，保持它打开
    chrome.action.openPopup();
  }
});