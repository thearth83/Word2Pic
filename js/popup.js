/**
 * Word2Pic Chrome插件 - 主要功能脚本
 * 实现文字转图片的核心功能
 */

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  const textInput = document.getElementById('text-input');
  const aiGenerateBtn = document.getElementById('ai-generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const imagePreview = document.getElementById('image-preview');
  const pinButton = document.createElement('button');
  
  // 添加固定按钮
  pinButton.id = 'pin-btn';
  pinButton.className = 'btn';
  pinButton.textContent = '固定窗口';
  pinButton.style.position = 'absolute';
  pinButton.style.top = '10px';
  pinButton.style.right = '10px';
  pinButton.style.padding = '5px 10px';
  pinButton.style.fontSize = '12px';
  document.body.appendChild(pinButton);
  
  // 固定按钮点击事件
  pinButton.addEventListener('click', function() {
    isPinned = !isPinned;
    if (isPinned) {
      pinButton.textContent = '取消固定';
      // 通知后台脚本保持弹窗打开
      chrome.runtime.sendMessage({action: 'pinPopup', pinned: true});
    } else {
      pinButton.textContent = '固定窗口';
      // 通知后台脚本取消固定
      chrome.runtime.sendMessage({action: 'pinPopup', pinned: false});
    }
  });
  
  // 生成的图片URL
  let generatedImage = null;
  let isPinned = false;      // 窗口是否固定
  
  // 从存储中恢复数据
  chrome.storage.local.get(['savedText', 'savedImage'], function(result) {
    if (result.savedText) {
      textInput.value = result.savedText;
    }
    
    if (result.savedImage) {
      generatedImage = result.savedImage;
      updatePreviewImage(generatedImage);
    }
  });
  
  // AI生图按钮点击事件
  aiGenerateBtn.addEventListener('click', function() {
    const text = textInput.value.trim();
    
    if (!text) {
      alert('请输入文字内容！');
      return;
    }
    
    // 保存文本到存储
    chrome.storage.local.set({savedText: text});
    
    // 显示加载状态
    showLoading();
    
    // 禁用按钮，防止重复点击
    aiGenerateBtn.disabled = true;
    
    // 调用火山方舟大模型API生成图片
    generateImageWithAI(text)
      .then(imageUrl => {
        // 更新预览图片
        updatePreviewImage(imageUrl);
        
        // 保存图片到存储
        chrome.storage.local.set({savedImage: imageUrl});
        
        // 启用保存按钮
        saveBtn.disabled = false;
        
        // 隐藏加载状态
        hideLoading();
        
        // 5秒后恢复按钮状态
        setTimeout(() => {
          aiGenerateBtn.disabled = false;
        }, 5000);
      })
      .catch(error => {
        console.error('生成图片失败: ', error);
        alert('生成图片失败，请重试！');
        
        // 隐藏加载状态
        hideLoading();
        
        // 5秒后恢复按钮状态
        setTimeout(() => {
          aiGenerateBtn.disabled = false;
        }, 5000);
      });
  });
  
  // 保存按钮点击事件
  saveBtn.addEventListener('click', function() {
    if (generatedImage) {
      // 创建下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = generatedImage;
      downloadLink.download = 'word2pic_' + new Date().getTime() + '.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  });
  

  
  /**
   * 调用火山方舟大模型API生成图片
   * @param {string} text - 需要生成图片的文本
   * @returns {Promise<string>} - 生成的图片URL
   */
  async function generateImageWithAI(text) {
    const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
    const API_KEY = '56affdcf-6def-4d51-8089-f8e374fb94e7';
    
    // 构建提示词，确保文字是主体，图片是背景
    const prompt = `使用以下文本为主题生成背景图片，文字是主体，背景图片不得喧宾夺主。生成的图片中展示全部文字，禁止修改提供的文字：${text}`;
    
    const requestData = {
      model: "doubao-seedream-4-0-250828",
      prompt: prompt,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: true
    };
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 从响应中提取图片URL
      if (data.data && data.data[0] && data.data[0].url) {
        return data.data[0].url;
      } else {
        throw new Error('API响应格式不正确');
      }
    } catch (error) {
      console.error('调用大模型API失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新预览图片
   * @param {string} imageUrl - 图片URL
   */
  function updatePreviewImage(imageUrl) {
    // 清空预览区域
    imagePreview.innerHTML = '';
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '生成的图片';
    
    // 保存图片URL
    generatedImage = imageUrl;
    
    // 添加到预览区域
    imagePreview.appendChild(img);
  }
  
  /**
   * 显示加载状态
   */
  function showLoading() {
    // 创建加载状态元素
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">正在生成图片...</div>
    `;
    
    // 添加到预览区域
    const previewContainer = document.getElementById('preview-container');
    previewContainer.appendChild(loading);
  }
  
  /**
   * 隐藏加载状态
   */
  function hideLoading() {
    // 移除加载状态元素
    const loading = document.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }
});